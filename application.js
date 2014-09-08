#!/usr/bin/env node

var args = process.argv.slice(2);
var _ = require("lodash");
var cli = require([__dirname, "lib", "cli"].join("/"));

cli.run(_.first(args));
