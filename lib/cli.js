var pkg = require([__dirname, "..", "package"].join("/"));
var _ = require("lodash");
var yargs = require("yargs");
var commands = require([__dirname, "commands"].join("/"));

module.exports = {

    initialize: function(options){
        var options = _.merge(options, {
            version: {
                describe: "Print the Cuisine version"
            }
        });

        yargs.help("help");
        yargs.version(pkg.version, "version");
        yargs.options(options).argv;
    },

    run: function(command){
        if(_.has(commands, command)){
            this.initialize(commands[command].options);
            commands[command].execute(yargs.argv);
        }
        else{
            this.initialize({});
            console.log(["Subcommand ", command, " not found!"].join("'"))
        }
    }

}
