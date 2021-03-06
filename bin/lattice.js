#!/usr/bin/env node

var fs = require('fs'),
    getopt = require('node-getopt'),
    graphlib = require('graphlib'),
    Grammar = require('../index').Grammar

var defaultSize = 4
var defaultNodeName = 'node', defaultInitNodeName = 'init', defaultEdgeName = 'edge'

var opt = getopt.create([
  ['s' , 'size=N'          , 'specify size of lattice (default: ' + defaultSize + ')'],
  ['u' , 'undirected'      , 'undirected: single edges between adjacent nodes'],
  ['p' , 'periodic'        , 'periodic boundary conditions'],
  ['e' , 'edge=STRING'     , 'edge name'],
  ['n' , 'node=STRING'     , 'node name'],
  ['i' , 'initial=STRING'  , 'initial node name'],
  ['d' , 'dot'             , 'graphviz dot output'],
  ['v' , 'verbose'         , 'print debugging messages'],
  ['h' , 'help'            , 'display this help message']
])              // create Getopt instance
    .bindHelp()     // bind option 'help' to default action
    .parseSystem() // parse command line

var size = parseInt(opt.options.size) || defaultSize
var periodic = opt.options.periodic
var isDirected = !opt.options.undirected

if (periodic && size <= 2) {
  throw new Error ("Periodic boundary conditions on a 2x2 lattice yield a multigraph. Declining to output this.")
}

var g = new graphlib.Graph ({ directed: isDirected })

var xInit, yInit
if (periodic)
  xInit = yInit = 0
else
  xInit = yInit = Math.floor (size / 2)

// nodes
function xy(x,y) {
  x = (x + size) % size
  y = (y + size) % size
  return 'x' + x + 'y' + y
}

var nodePoints = 128  // size of a node, in points, for (neato) layout
for (var x = 0; x < size; ++x)
  for (var y = 0; y < size; ++y) {
    var name = ((x === xInit && y === yInit)
		? (opt.options.initial || defaultInitNodeName)
		: (opt.options.node || defaultNodeName))
    g.setNode (xy(x,y), { x: x,
			  y: y,
			  dot: { pos: (x*nodePoints) + ',' + ((size-1-y)*nodePoints),
                                 label: name },
			  name: name })
  }

// edges
var edgeName = opt.options.edge || defaultEdgeName
function addEdge (src, dest, label) {
  if (opt.options.verbose)
    console.warn ('adding edge from ' + src + ' to ' + dest + ': ' + JSON.stringify(label))
  g.setEdge (src, dest, label)
}
for (var x = 0; x < size; ++x)
  for (var y = 0; y < size; ++y) {
    
    if (x + 1 < size || periodic)
      addEdge (xy(x,y),
	       xy(x+1,y),
	       { dir: isDirected ? 'e' : 'h',
                 dot: { label: edgeName },
		 name: edgeName })

    if (y + 1 < size || periodic)
      addEdge (xy(x,y),
	       xy(x,y+1),
	       { dir: isDirected ? 's' : 'v',
                 dot: { label: edgeName },
		 name: edgeName })

    if (isDirected) {
      if (x > 0 || periodic)
	addEdge (xy(x,y),
		 xy(x-1,y),
		 { dir: 'w',
                   dot: { label: edgeName },
		   name: edgeName })

      if (y > 0 || periodic)
	addEdge (xy(x,y),
		 xy(x,y-1),
		 { dir: 'n',
                   dot: { label: edgeName },
		   name: edgeName })
    }
  }

// output
if (opt.options.dot)
  console.log (Grammar.prototype.toDot(g))
else
  console.log (JSON.stringify (graphlib.json.write (g), null, 2))
