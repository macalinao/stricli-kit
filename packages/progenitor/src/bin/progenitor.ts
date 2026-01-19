#!/usr/bin/env bun
import { run } from "@stricli/core";
import { app, createContext } from "../generated/app.js";

const context = await createContext();
await run(app, process.argv.slice(2), context);
