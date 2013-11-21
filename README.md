dash-grunt-docset
=================

That's right... using Grunt to generate a Grunt docset for Dash

##How to use

###Initial Installation
1. Download or clone this repository.
2. Make sure that `nodejs` is installed.
3. In Terminal `cd` to the root directory of `dash-grunt-docset` and run `npm install`.
4. Create docset:

   __Basic:__ _only create grunt and grunt-contrib docs_  
   Run `grunt`.  
   
   __Advanced:__ _create docs for grunt, grunt-contrib and for any other grunt plugin with a readme._  
   - First, create a project outside of the `dash-grunt-docset` root (or use an existing project) with all of the grunt plugins to be added to documentation listed as dependencies in a `package.json` file.
   - Run `npm install` from the external project's root directory to install all dependencies.
   - Optionally setup more external projects
   - switch back to the `dash-grunt-docset` root and run the following: 
    
      ``
      grunt --ext1=PATH_TO_NODE_MODULES_1 --ext2=PATH_TO_NODE_MODULES_2
      ``
      
      You can include as many external paths as you'd like as long as they each have a unique name.
   
 
5. Open `Dash.app` preferences and select the `Docsets` section
6. Click the `+` in the lower left and navigate to and select `grunt.docset` in the root directory of `dash-grunt-docset`

### Maintenance
Each time the grunt task is run the documentation is overwritten. Dash will load the new changes automatically when reopened. If you are on a grunt doc page simply press `cmd + r`.

##Contributing
Contributions are welcome! Please note that additional grunt plugins should NOT be added to `package.json` unless they are part of grunt-contrib.
