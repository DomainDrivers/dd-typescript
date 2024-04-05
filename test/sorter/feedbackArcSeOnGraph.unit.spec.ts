/* eslint-disable @typescript-eslint/no-floating-promises */
import { Edge, FeedbackArcSeOnGraph, Node } from '#sorter';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deepEquals } from '../../src/utils';

describe('FeedbackArcSetOnGraph', () => {
  it('can find minimum number of edges to remove to make the graph acyclic', () => {
    //given
    let node1 = new Node('1');
    let node2 = new Node('2');
    let node3 = new Node('3');
    let node4 = new Node('4');
    node1 = node1.dependsOn(node2);
    node2 = node2.dependsOn(node3);
    node4 = node4.dependsOn(node3);
    node1 = node1.dependsOn(node4);
    node3 = node3.dependsOn(node1);

    //when
    const toRemove: Edge[] = FeedbackArcSeOnGraph.calculate([
      node1,
      node2,
      node3,
      node4,
    ]);

    assert.equal(toRemove.length, 2);
    assert.ok(
      [new Edge(3, 1), new Edge(4, 3)].filter((e) =>
        toRemove.some((t) => deepEquals(t, e)),
      ).length === toRemove.length,
    );
  });

  it('when graph is acyclic there is nothing to remove', () => {
    //given
    let node1 = new Node('1');
    let node2 = new Node('2');
    const node3 = new Node('3');
    const node4 = new Node('4');
    node1 = node1.dependsOn(node2);
    node2 = node2.dependsOn(node3);
    node1 = node1.dependsOn(node4);

    //when
    const toRemove: Edge[] = FeedbackArcSeOnGraph.calculate([
      node1,
      node2,
      node3,
      node4,
    ]);

    //then
    assert.equal(toRemove.length, 0);
  });
});
