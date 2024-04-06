import { Capability } from '#shared';
import type { ObjectSet } from '../../utils';
import { EmployeeId } from './employeeId';
import type { Seniority } from './seniority';

export class Employee {
  #id = EmployeeId.newOne();
  #version: number;
  #name: string;
  #lastName: string;
  #seniority: Seniority;
  #capabilities: ObjectSet<Capability>;

  constructor(
    id: EmployeeId,
    name: string,
    lastName: string,
    seniority: Seniority,
    capabilities: ObjectSet<Capability>,
    version: number = 0,
  ) {
    this.#id = id;
    this.#name = name;
    this.#lastName = lastName;
    this.#seniority = seniority;
    this.#capabilities = capabilities;
    this.#version = version;
  }

  public get id() {
    return this.#id;
  }
  public get name() {
    return this.#name;
  }
  public get lastName() {
    return this.#lastName;
  }
  public get seniority() {
    return this.#seniority;
  }
  public get capabilities() {
    return this.#capabilities;
  }
  public get version() {
    return this.#version;
  }
}
