WORK IN PROGRESS PEOPLE, sorry, I promis to update the readme soon! 

# Introduction
The purpose of this plugin is to visualize ontologies, it is part of the new version of Ontology Lookup Service (OLS), provided by the EBI (European Bioinformatics Institute), that can be found at http://www.ebi.ac.uk/ols/. The plugin is interactive and was designed customizable to promote reusability.     

#How to install the plugin

#How to start to plugin
The Plugin has to be started with 3 parameters: term,  netwerkoptions, visoptions. The visoptions are the options that the visjs library offers to the user.
However, some of the options are overwritten during plugin execution (Mainly options for the root nodes), they can be adjusted within the second option field (“network options”).

# OLS - JSON structure:
If the option OLS structure true is activated, the plugin expects the following structure:
The service does one webservice call e.g.;
http://www.ebi.ac.uk/ols/beta/api/ontologies/cmpo/terms?iri=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FCHEBI_33839 - there is a link to the graph data included

The second webservice call actually gets us graph data, e.g.
http://www.ebi.ac.uk/ols/beta/api/ontologies/cmpo/terms/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252FCHEBI_33839/graph


# DEFAULT OPTIONS that the Plugin uses
/*Default options for the network – these are all options that this field offers at the moment!*/

```javascript
var visNetworkOptions = {
 		physics:{
 			barnesHut: {
 				gravitationalConstant: -2000,
 				centralGravity: 0.3,
 				springLength: 95,
 				springConstant: 0.04,
 				avoidOverlap: 0,
 				damping: 0.09
 			},
 			stabilization: {
 				enabled:true,
 				iterations:2000,
 				updateInterval:25}
 		},
 		interaction:{hover:true, navigationButtons:true, keyboard: false},
    layout : { hierarchical: {  enabled:false} },
 		nodes:{
 			shape: "box",
 			mass: 2
 		},
 		edges : {
 			scaling:{label:{
 				min:12,
 				max:30,
 				maxVisible:30,
 				drawThreshold: 12
 			}},
 			hoverWidth: 2,
 			width : 1.5,
 			selectionWidth: 2,
 			shadow:true,
 			font: {align:"middle"},
 			arrows: "to"
 		}
 	};
```



/*Define vis default options for ever network before start up*/ - these are the vis js options that are used at the moment. However, you could try to start it with many other
vis js options!

```javascript
	var networkOptions = {
 		webservice : {URL: "no address passed", OLSschema: true},
 		displayOptions : {
 			showButtonBox: true,
 			showInfoWindow: true,
 			showLegend: true
 		},
 		clusterOptions: {
 			automaticClusterThreshold:50,
 			parentClusterSymbole:"star",
 			childrenClusterSymbole:"triangle",
 			otherClusterSymbole:"dot",
 			clusterMass:1,
 			clusterMaxAppearanceSize: 50,
 			clusterEdgeProperties:{physics:false, dashes:true, shadow:false}
 		},
 		appearance: {
 			colorMap: ['#8dd3c7','#ffffb3','#bebada','#fba399','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f',
 				'#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99', "#e31a1c", '#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928',
 				"#00FFFF", "#D9DCC6", "#FF7F50", "#6495ED", "#008B8B","#FF8C00","#FF1493", "#696969", "#FFD700", "#4B0082", "#808000", "#CD853F", "#B0E0E6", "#D8BFD8",
 				"#00FFFF", "#D9DCC6", "#FF7F50", "#6495ED", "#008B8B","#FF8C00","#FF1493", "#696969", "#FFD700"],
 			maxLabelLength: 35
 		},

 		rootNode:{
 			color:{
 				border: '#000000',
 				background: '#e06868',
 				highlight: {
 					border: '#000000',
 					background: '#e06868'},
 				hover: {
 					border: '#000000',
 					background: '#e06868'    }
 			},
 			rootMass:2,
 			connectingEdges:{
 				color : "#e06868",
 				width : 2.5
 			}
 		},

 		ZoomOptions:{
 			scale: 1.8,
 			offset: {x:0,y:0},
 			animation: {
 				duration: 1000,
 				easingFunction: "easeInOutQuad" }
 		},

 		callbacks: {
 			onSelectNode: onSelectNode,
 			onDoubleClick: onDoubleClick,
 			onSelectEdge: onSelectEdge
 		}
 	};
```


# VIS options
All VIS JS network Options can be found (but remember, some options are overwritten by the plugin!):
http://visjs.org/docs/network/
