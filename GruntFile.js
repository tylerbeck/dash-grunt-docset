module.exports = function( grunt ){

	// load node modules ------------------
	var jsdom = require('jsdom');
	var _ = require('lodash');
	var q = require('q');
	var fs = require("fs-extra");
	var sqlite3 = require('sqlite3').verbose();
	var marked = require('marked');

	var dbFile = "grunt.docset/Contents/Resources/docSet.dsidx";
	var cpath = "grunt.docset/Contents/Resources/Documents/content/";
	var node_module_path = "node_modules";

	// build config -----------------------
	var config = {
		fetchGruntDocs: {
			"grunt-core": {
				type: 'Module',
				headings: true,
				headingType: 'Method',
				list: [
					{
						url: "http://gruntjs.com/api/grunt",
						selector: ".page",
						dest: "grunt.html"
					},
					{
						url: "http://gruntjs.com/api/grunt.config",
						selector: ".page",
						dest: "grunt.config.html"
					},
					{
						url: "http://gruntjs.com/api/grunt.event",
						selector: ".page",
						dest: "grunt.event.html"
					},
					{
						url: "http://gruntjs.com/api/grunt.fail",
						selector: ".page",
						dest: "grunt.fail.html"
					},
					{
						url: "http://gruntjs.com/api/grunt.file",
						selector: ".page",
						dest: "grunt.file.html"
					},
					{
						url: "http://gruntjs.com/api/grunt.log",
						selector: ".page",
						dest: "grunt.log.html"
					},
					{
						url: "http://gruntjs.com/api/grunt.option",
						selector: ".page",
						dest: "grunt.option.html"
					},
					{
						url: "http://gruntjs.com/api/grunt.task",
						selector: ".page",
						dest: "grunt.task.html"
					},
					{
						url: "http://gruntjs.com/api/grunt.template",
						selector: ".page",
						dest: "grunt.template.html"
					},
					{
						url: "http://gruntjs.com/api/grunt.util",
						selector: ".page",
						dest: "grunt.util.html"
					},
					{
						url: "http://gruntjs.com/api/inside-tasks",
						selector: ".page",
						dest: "other.inside-tasks.html"
					},
					{
						url: "http://gruntjs.com/api/exit-codes",
						selector: ".page",
						dest: "other.exit-codes.html"
					}
				]
			},
			"grunt-guides": {
				type: 'Guide',
				headings: false,
				headingType: 'none',
				list: [
					{
						url: "http://gruntjs.com/getting-started",
						selector: ".page",
						dest: "getting-started.html"
					},
					{
						url: "http://gruntjs.com/configuring-tasks",
						selector: ".page",
						dest: "configuring-tasks.html"
					},
					{
						url: "http://gruntjs.com/sample-gruntfile",
						selector: ".page",
						dest: "sample-gruntfile.html"
					},
					{
						url: "http://gruntjs.com/creating-tasks",
						selector: ".page",
						dest: "creating-tasks.html"
					},
					{
						url: "http://gruntjs.com/creating-plugins",
						selector: ".page",
						dest: "creating-plugins.html"
					},
					{
						url: "http://gruntjs.com/using-the-cli",
						selector: ".page",
						dest: "using-the-cli.html"
					},
					{
						url: "http://gruntjs.com/installing-grunt",
						selector: ".page",
						dest: "installing-grunt.html"
					},
					{
						url: "http://gruntjs.com/frequently-asked-questions",
						selector: ".page",
						dest: "frequently-asked-questions.html"
					},
					{
						url: "http://gruntjs.com/project-scaffolding",
						selector: ".page",
						dest: "project-scaffolding.html"
					},
				]
			}
		},
		loadReadmeFiles:{
			core: {
				node_module_path: "node_modules"
			}
		}
	};
	//add paths pased as args
	var args = process.argv;
	var isUserDir = /^\-\-([a-z_\-0-9]+)=(.*)$/i;
	args.forEach( function( arg ){
		var matches = arg.match( isUserDir );
		if (matches){
			if ( grunt.file.isDir(matches[2]) ){
				grunt.log.writeln( "Adding '"+matches[2]+"' to node_modules list");
				config['loadReadmeFiles'][ matches[1] ] = { node_module_path: matches[2] };
			}
			else {
				grunt.log.errorln( "'"+matches[2]+"' is not a valid directory");
			}
		}
	});

	grunt.initConfig( config );

	// register default task ---------------
	grunt.registerTask('default',[
		'init',
		'fetchGruntDocs',
	    'loadReadmeFiles'
	]);

	grunt.registerTask('test', function(){
		console.log( process.argv );
	});

	// helper methods ----------------------
	// insert record, inserts a record into the docset sqlite3 database
	function insertRecord( db, name, type, path ){
		var d = q.defer();
		db.run("INSERT OR IGNORE INTO searchIndex(name, type, path) VALUES ('"+name+"', '"+type+"', '"+path+"');", function(){
			d.resolve();
		});
		return d.promise;
	}

	// create tasks
	grunt.registerMultiTask( 'fetchGruntDocs', function(){

		var template = grunt.file.read( "page.template" );

		var done = this.async();

		var list = this.data.list;
		var item;
		var db = new sqlite3.Database( dbFile, sqlite3.OPEN_READWRITE );
		var data = this.data;

		var loadNext = function(){
			item = list.pop();
			if (item){
				console.log('loading: %s', item.url);
				jsconf.url = item.url;
				jsdom.env( jsconf );
			}
			else{
				done();
			}
		};

		var handleJSDomLoaded = function( errors, window){
			if ( errors ){
				errors.forEach( function( error, index ){
					console.log( error );
				} )
			}
			if ( window ){
				var $ = window.$;
				var $page = $( item.selector );
				$page.find( '.end-link' ).remove();

				if ($page.length){
					var promises = [];
					var file = _.template( template, {pageContent:$page.html()} );
					//replace links
					//TODO: Move link replacement to jQuery DOM operation
					file = file.replace( /\/(grunt\.[^#"]+)/g, "../content/$1.html" );
					file = file.replace( /\/("[a-z\-0-9]+")/g, "../content/$1.html" );
					file = file.replace( /☃/g, "&#9731;" );
					file = file.replace( /☆/g, "&#9734;" );
					grunt.file.write( cpath+item.dest, file );

					//add sqlite entries for modules
					var module = $('h1').html();
					promises.push( insertRecord( db, module, data.type, "content/"+item.dest ) );

					//add sqlite entries for methods
					if (data.headings){
						var $h3 = $('h3');
						$h3.each( function(){
							var $a = $(this ).find( 'a.anchor' );
							var path =  "content/"+item.dest+$a.attr('href');
							var name = $a.html();
							var type = data.headingType;
							promises.push( insertRecord( db, name, type, path ) );
						});
					}

					q.all( promises )
						.then( function(){
						     window.close();
	                         loadNext();
					    });

				}
				else{
					grunt.log.error('error parsing: '+item.url);
					window.close();
					loadNext();
				}
			}
		};

		var jsconf = {
			url: "",
			scripts: [ "http://code.jquery.com/jquery.js" ],
			done: handleJSDomLoaded
		};

		loadNext();

	} );

	grunt.registerMultiTask( 'loadReadmeFiles', function(){

		var done = this.async();
		var isGrunt = /^grunt\-/;
		var promises = [];
		var db = new sqlite3.Database( dbFile, sqlite3.OPEN_READWRITE );
		var template = grunt.file.read( "page.template" );

		var node_module_path = this.data.node_module_path;

		fs.readdirSync( node_module_path ).forEach( function ( file ) {
			if (file.match(isGrunt)){
				//TODO: update to account for case variations
				var readmePath = node_module_path+"/"+file+"/README.md";
				if ( grunt.file.exists( readmePath ) ){
					console.log('loading: %s', readmePath );
					var d = q.defer();
					var md = grunt.file.read( readmePath );
					marked( md, function( err, result ){
						if (err) d.reject(err);
						var html = _.template( template, {pageContent:'<div class="hero-unit">'+result+'</div>'} );
						html = html.replace(/href=['"]http:\/\/gruntjs\.com\/([^'"]+)['"]/, "href=\"../content/$1.html\"");

						//save html
						var fpath = cpath+file+".html";
						grunt.file.write( fpath, html );

						//add records
						promises.push( insertRecord( db, file, "Package", "content/"+file+".html" ) );
						d.resolve();
					});

					promises.push( d.promise );
				}
			}
		});

		q.all( promises ).
			then( function(){
			   done();
		    });

	});

	grunt.registerTask('init', function(){
		var done = this.async();
		fs.removeSync( dbFile );
		fs.removeSync( cpath );
		fs.mkdirSync( cpath );
		var db = new sqlite3.Database( dbFile );
		db.run("CREATE TABLE searchIndex(id INTEGER PRIMARY KEY, name TEXT, type TEXT, path TEXT);", function(){
			db.run("CREATE UNIQUE INDEX anchor ON searchIndex (name, type, path);", function(){
				done();
			});
		});
	});
};
