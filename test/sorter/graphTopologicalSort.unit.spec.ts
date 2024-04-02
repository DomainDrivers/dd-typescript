/* eslint-disable @typescript-eslint/no-floating-promises */
import { GraphTopologicalSort, Node, Nodes } from '#sorter';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('GraphTopologicalSort', () => {
  it('test topological sort with simple dependencies', () => {
    //given
    const node1 = new Node('Node1');
    let node2 = new Node('Node2');
    let node3 = new Node('Node3');
    let node4 = new Node('Node4');
    node2 = node2.dependsOn(node1);
    node3 = node3.dependsOn(node1);
    node4 = node4.dependsOn(node2);

    const nodes = new Nodes([node1, node2, node3, node4]);

    //when
    const sortedNodes = GraphTopologicalSort.sort(nodes);

    //then
    assert.equal(sortedNodes.all.length, 3);

    assert.equal(sortedNodes.all[0].all().length, 1);
    assert.ok([...sortedNodes.all[0].all()].some((n) => n.equals(node1)));

    assert.equal(sortedNodes.all[1].all().length, 2);
    assert.ok([...sortedNodes.all[1].all()].some((n) => n.equals(node2)));
    assert.ok([...sortedNodes.all[1].all()].some((n) => n.equals(node3)));

    assert.equal(sortedNodes.all[2].all().length, 1);
    assert.ok([...sortedNodes.all[2].all()].some((n) => n.equals(node4)));
  });

  it('test topological sort with linear dependencies', () => {
    //given
    let node1 = new Node('Node1');
    let node2 = new Node('Node2');
    let node3 = new Node('Node3');
    let node4 = new Node('Node4');
    const node5 = new Node('Node5');
    node1 = node1.dependsOn(node2);
    node2 = node2.dependsOn(node3);
    node3 = node3.dependsOn(node4);
    node4 = node4.dependsOn(node5);

    const nodes = new Nodes([node1, node2, node3, node4, node5]);

    //when
    const sortedNodes = GraphTopologicalSort.sort(nodes);

    //then
    assert.equal(sortedNodes.all.length, 5);

    assert.equal(1, sortedNodes.all[0].all().length);
    assert.ok([...sortedNodes.all[0].all()].some((n) => n.equals(node5)));

    assert.equal(1, sortedNodes.all[1].all().length);
    assert.ok([...sortedNodes.all[1].all()].some((n) => n.equals(node4)));

    assert.equal(1, sortedNodes.all[2].all().length);
    assert.ok([...sortedNodes.all[2].all()].some((n) => n.equals(node3)));

    assert.equal(1, sortedNodes.all[3].all().length);
    assert.ok([...sortedNodes.all[3].all()].some((n) => n.equals(node2)));

    assert.equal(1, sortedNodes.all[4].all().length);
    assert.ok([...sortedNodes.all[4].all()].some((n) => n.equals(node1)));
  });

  it('test nodes without dependencies', () => {
    //given
    const node1 = new Node('Node1');
    const node2 = new Node('Node2');
    const nodes = new Nodes([node1, node2]);

    //when
    const sortedNodes = GraphTopologicalSort.sort(nodes);

    //then
    assert.equal(sortedNodes.all.length, 1);
  });

  it('test cyclic dependencies', () => {
    //given
    let node1 = new Node('Node1');
    let node2 = new Node('Node2');
    node2 = node2.dependsOn(node1);
    node1 = node1.dependsOn(node2); // making it cyclic
    const nodes = new Nodes([node1, node2]);

    //when
    const sortedNodes = GraphTopologicalSort.sort(nodes);

    //then
    assert.equal(sortedNodes.all.length, 0);
  });
});
