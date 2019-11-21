const path = require('path');
const nodeExternals = require('webpack-node-externals');

// function style
// we could also use separate wp.config files
module.exports = (env, argv) => {
    // branch on argv.env (used as an arbitrary flag) 
    console.log(argv);

    var OUT_DIR, ENTRY, TARGET, EXTERNALS;
    if(argv.env === 'node-mode') {
        OUT_DIR = "dist-node";
        ENTRY = "index.node.ts";
        TARGET = "node";
        EXTERNALS = [nodeExternals( 
            // desperate attempt: DO bundle firestore??
            // A LITTLE STORY: when we include firestore (which we want to do),
            // proto_buf module throws an error: 'Not supported', 'isNode' fails even though we really are running in node.
            // possibly proto_buf is getting fooled because we redefine window (in index.node.ts) ?? 
                // SIDE NOTE: (which we must do, we're pretty sure, to make babylonjs happy 
                // OR do we only need window because the node version of the app shares code that prints debug messages on the webpage. We may as well try to purge DOM references 
                // from our node code...but babylonjs still definitely at least needs HTMLElement to be defined).
            // ANYWAY: Whitelisting /firestore/ does solve the 'not supported' thing BUT leads to another error:
            // `Discarding enity body for GET requests`. (probably from xhr2)
            // So, for now, we are going back to using firebase's realtime db instead of firestore
            // { whitelist: [/firestore/] }
            )]; // TODO: OIMO CANNON for babylon?
    } 
    else if(argv.env === 'build-tests') {
        OUT_DIR = "dist-tests";
        ENTRY = "test/RunTests.ts";
        TARGET = "node";
        EXTERNALS = [nodeExternals()];
    }
    else {
        OUT_DIR = "dist-browser";
        ENTRY = "index.browser.ts";
        TARGET = "web";
        EXTERNALS = {}; // TODO: OIMO CANNON?
    }

    return ({
        entry : './src/' + ENTRY, 
        output : {
            filename: 'app.bundle.js',
            path:path.resolve(__dirname, OUT_DIR) 
        },
        resolve: {
            extensions: ['.ts', '.js', '.json']
        },
        module: {
            rules: [{
                test: /\.(ts|js)$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }]
        },
        mode: 'development',
        // Apparently (see binyamin's medium article), we want to prevent webpack from bundling node modules when we build for node,
        // and, apparently, 'nodeExternals()' accomplishes this
        externals: EXTERNALS,  

        // Firebase gave us some advice about making 'main' the first mainField in 'resolve', when we ran this in another project/config.
        // It doesn't seem to mind the default set up with this config.
        // SO WE COULD REMOVE THIS resolve SETTING. IT'S JUST THE DEFAULT.
        // resolve: {
        //     // mainFields: ['main', 'browser', 'module'] // many module not found errors
        //     mainFields: ['browser', 'module', 'main'] // the default, if mainFields is not specified. i.e. we could delete 'resolve' entirely
        // },
        target: TARGET // 'node'
    });
}
    