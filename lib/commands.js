var fs = require("fs");
var _ = require("lodash");
var gift = require("gift");
var async = require("async");
var colors = require("colors");
var proc = require("child_process");

var version;
var cookbook_name;

module.exports = {

    install: {
        options: {},

        execute: function(options){}
    },

    lint: {
        options: {},

        execute: function(options){
            console.log("Running Foodcritic...".green);
            proc.exec("foodcritic .", function(err, stdout, stderr){
                console.log(stdout);
                if(err){
                    console.log(stderr);
                    console.log("Foodcritic failed!".red);
                    process.exit(1);
                }
            });
        }
    },

    test: {
        options: {},

        execute: function(options){
            console.log("Running ChefSpec...".green);
            proc.exec("rspec", function(err, stdout, stderr){
                if(err){
                    console.log(stderr);
                    console.log("ChefSpec failed!".red);
                    process.exit(1);
                }
            });
        }
    },

    upload: {
        options: {
            "skip-tag": {
                describe: "Skip git tag creation",
                default: false,
                boolean: true
            },

            "bump": {
                describe: "Version level to bump cookbook [major|minor|patch]",
                required: true
            }
        },

        execute: function(options){
            var steps = {
                bump: function(fn){
                    console.log("Bumping cookbook version...".green);
                    fs.readFile([process.cwd(), "metadata.rb"].join("/"), function(err, content){
                        if(err || _.isUndefined(content)){
                            console.log("Error reading metadata.rb!".red);
                            process.exit(1);
                        }

                        var version_parts = content.toString().match(/version.*/g)[0].match(/\S+/g)[1].replace(/"/g, "").replace(/'/g, "").split(".");

                        if(options["bump"] == "major"){
                            version_parts[0] = _.parseInt(version_parts[0]) + 1;
                            version_parts[1] = 0;
                            version_parts[2] = 0;
                        }
                        else if(options["bump"] == "minor"){
                            version_parts[1] = _.parseInt(version_parts[1]) + 1;
                            version_parts[2] = 0;
                        }
                        else if(options["bump"] == "patch")
                            version_parts[2] = _.parseInt(version_parts[2]) + 1;
                        else{
                            console.log("Please specify either major, minor or patch version to bump!".red);
                            process.exit(1);
                        }

                        version = version_parts.join(".");
                        cookbook_name = content.toString().match(/name.*/g)[0].match(/\S+/g)[1].replace(/"/g, "").replace(/'/g, "");

                        fs.writeFile([process.cwd(), "metadata.rb"].join("/"), content.toString().replace(/version.*/g, ["version\t\t\t", "'", version, "'"].join("")), function(err){
                            if(err){
                                console.log("Error writing metadata.rb!".red)
                                process.exit(1);
                            }

                            console.log(version + "\n");
                            return fn();
                        });
                    });
                },

                tag: function(fn){
                    if(_.isUndefined("skip-tag") || !options["skip-tag"]){
                        console.log("Creating git tag...".green);
                        var repository = gift(process.cwd());
                        repository.commit(["Bump version to", version].join(" "), {o: "metadata.rb"}, function(err){
                            if(err){
                                console.log("Failed to commit metadata.rb!".red);
                                process.exit(1);
                            }

                            console.log(version);

                            repository.create_tag(version, function(err){
                                if(err){
                                    console.log(["Failed to create tag", version].join(" ").red);
                                    process.exit(1);
                                }

                                console.log();
                                return fn();
                            });
                        });
                    }
                    else{
                        console.log("Skipping tag creation...\n".yellow);
                        return fn();
                    }
                }
            }

            async.series(steps, function(err, results){
                console.log("Uploading to Chef server...".green);/*
                proc.exec(["knife cookbook upload -o", _.initial(process.cwd().split("/")).join("/"), cookbook_name].join(" "), function(err, stdout, stderr){
                    if(err)
                        console.log(stderr);
                    else
                        console.log(["Successfully uploaded", cookbook_name, "to version", version].join(" "));
                });*/
            });
        }
    }

}
