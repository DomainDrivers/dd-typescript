import { Capability } from '#shared';
import type { ObjectSet } from '#utils';
import { EmployeeId } from './employeeId';
import type { Seniority } from './seniority';

export class Employee {
  private _id = EmployeeId.newOne();
  private _version: number;
  private _name: string;
  private _lastName: string;
  private _seniority: Seniority;
  private _capabilities: ObjectSet<Capability>;

  constructor(
    id: EmployeeId,
    name: string,
    lastName: string,
    seniority: Seniority,
    capabilities: ObjectSet<Capability>,
    version: number = 0,
  ) {
    this._id = id;
    this._name = name;
    this._lastName = lastName;
    this._seniority = seniority;
    this._capabilities = capabilities;
    this._version = version;
  }

  public get id() {
    return this._id;
  }
  public get name() {
    return this._name;
  }
  public get lastName() {
    return this._lastName;
  }
  public get seniority() {
    return this._seniority;
  }
  public get capabilities() {
    return this._capabilities;
  }
  public get version() {
    return this._version;
  }
}
