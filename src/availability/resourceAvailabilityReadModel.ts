import { TimeSlot } from '#shared';
import { PostgresRepository } from '#storage';
import { UTCDate } from '@date-fns/utc';
import { parseJSON } from 'date-fns';
import pg from 'pg';
import format from 'pg-format';
import { Calendar, Calendars, Owner, ResourceId } from '.';
import { ObjectMap, ObjectSet, UUID } from '../utils';

const calendar_query = `
WITH AvailabilityWithLag AS (
    SELECT
        resource_id,
        taken_by,
        from_date,
        to_date,
        COALESCE(LAG(to_date) OVER (PARTITION BY resource_id, taken_by ORDER BY from_date), from_date) AS prev_to_date
    FROM  
        availability.availabilities
    WHERE
        from_date >= %L 
        AND to_date <= %L
        AND resource_id = ANY (%L)
    
),
GroupedAvailability AS (
    SELECT
        resource_id,
        taken_by,
        from_date,
        to_date,
        prev_to_date,
        CASE WHEN
            from_date = prev_to_date
            THEN 0 ELSE 1 END
        AS new_group_flag,
        SUM(CASE WHEN
            from_date = prev_to_date
            THEN 0 ELSE 1 END)
        OVER (PARTITION BY resource_id, taken_by ORDER BY from_date) AS grp
    FROM  
        AvailabilityWithLag
)
SELECT
    resource_id,
    taken_by,
    MIN(from_date) AS start_date,
    MAX(to_date) AS end_date
FROM
    GroupedAvailability
GROUP BY
    resource_id, taken_by, grp
ORDER BY
    start_date;
 `;

type ReadModelQueryType = {
  resource_id: string;
  taken_by: string;
  start_date: string;
  end_date: string;
};

export class ResourceAvailabilityReadModel extends PostgresRepository {
  constructor(client?: pg.Client | pg.PoolClient) {
    super(client);
  }

  public load = async (
    resourceId: ResourceId,
    timeSlot: TimeSlot,
  ): Promise<Calendar> => {
    const loaded = await this.loadAll(ObjectSet.from([resourceId]), timeSlot);
    return loaded.get(resourceId);
  };

  public loadAll = async (
    resourceIds: ObjectSet<ResourceId>,
    timeSlot: TimeSlot,
  ): Promise<Calendars> => {
    const sql = format(
      calendar_query,
      timeSlot.from,
      timeSlot.to,
      `{${resourceIds.join(',')}}`,
    );

    const result = await this.client.query<ReadModelQueryType>(sql);

    const calendars = ObjectMap.empty<
      ResourceId,
      ObjectMap<Owner, TimeSlot[]>
    >();

    for (const entity of result.rows) {
      const resource = UUID.from(entity.resource_id);
      const key = ResourceId.from(resource);
      const takenByUuid = entity.taken_by ? UUID.from(entity.taken_by) : null;
      const takenBy =
        takenByUuid === null ? Owner.none() : new Owner(takenByUuid);
      const fromDate = new UTCDate(parseJSON(entity.start_date));
      const toDate = new UTCDate(parseJSON(entity.end_date));
      const loadedSlot = new TimeSlot(fromDate, toDate);

      const calendar = calendars.getOrSet(key, () =>
        ObjectMap.empty<Owner, TimeSlot[]>(),
      );
      calendar.getOrSet(takenBy, () => []).push(loadedSlot);
    }

    return new Calendars(
      ObjectMap.from(
        calendars.map(({ key, value }) => [key, new Calendar(key, value)]),
      ),
    );
  };
}
