import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { resolve } from "node:path";

const root = resolve(Bun.argv[2] ?? "schemas");
const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
const paths = Array.from(new Bun.Glob("**/*.json").scanSync({ cwd: root })).sort();

for (const path of paths) {
  const schema: unknown = await Bun.file(resolve(root, path)).json();
  if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
    throw new Error(`${path}: expected a JSON Schema object`);
  }
  if (!("$schema" in schema) || schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    throw new Error(`${path}: declare JSON Schema draft 2020-12`);
  }
  if (!("$id" in schema) || typeof schema.$id !== "string" || schema.$id.length === 0) {
    throw new Error(`${path}: declare a unique $id`);
  }
  ajv.addSchema(schema, path);
}

for (const path of paths) {
  if (!ajv.getSchema(path)) throw new Error(`${path}: compilation failed`);
}

console.log(`Validated ${paths.length} authored JSON schemas`);
