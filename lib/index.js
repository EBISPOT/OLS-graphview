/*
 * ols-graphview
 * https://github.com/LLTommy/ols-graphview
 * Copyright (c) 2016 LLTommy
 * Licensed under the Apache-2.0 license.
 */

 var Awesomplete = require('awesomplete');
 var vis =require("vis")

 module.exports = visualisation = function(){
 	/*
 	 * Ontology Visualisation for OLS (Ontology Lookup Service) provided by EMBL-EBI, created by Thomas Liener, 2015
 	 * The visualisation uses heavily the visjs library which can be found at http://visjs.org and is available under both Apache 2.0 and MIT license
 	 *
 	 */

 	/*
 	 * GLOBAL VARIABLES FOR the visualisation
 	 * - network object is needed in different functions to update options etc
 	 * - relationships saves all the relationships that are part of the visualisation so an Legend can be created
 	 * - clusterArray saves the Cluster names that are created for the data, necessary to be able to apply the join condition for clustering. These are the potential clusters, not the clusters currently in the network!
 	 * - root is an Array that saves all the root elements of the graphs - these are the ones that are parent elements (got clicked and expended, so the terms we load data for)
 	 * - nodes ?? Could be made a local variable?? Not if they are added to the graphdataset globally
 	 * - edges ?? Could be made a local variable?? Not if they are added to the graphdataset globally
 	 * - removedNodes - nodes that are set invisible in the legend are stored in this dataset while getting deleted in the original nodes dataset (graphdataset)
 	 * - removedEdges - edges that are set invisible in the legend are stored in this dataset while getting deleted in the original edges dataset (graphdataset)
 	 * - graphdataset, needed to make changes to the data that is part of the visualisation, especially adding nodes and edges
 	 * - colorMap is an Array that includes all Color Codes that are used for nodes/Edges and the legend depending on the relationship type
 	 * - webserviceURL: Is a string containing the URL where the webservice can be found, where we fetch data from in jason- it is the document URL with an inserted api keyword
 	 */

 	var network=null;
 	var relationships=[];
 	var clusterArray=[];
 	var root=[];
 	var nodes=new vis.DataSet();
 	var edges=new vis.DataSet();
  var removedNodes=new vis.DataSet();
 	var removedEdges=new vis.DataSet();
 	var graphdataset=new vis.DataSet();

  graphdataset= {
 		nodes: nodes,
 		edges: edges  };

 	var autoCompleteList={};

 	/*Define vis default options for ever network before start up*/
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
 			stabilization:  {
            enabled:true,
            iterations:250,
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


 	/*Default options for the network*/
 	var networkOptions = {
 		webservice : {URL: "no address passed", OLSschema: true},
 		displayOptions : {
 			showButtonBox: true,
 			showInfoWindow: true,
 			showLegend: true,
      showListOfExtendedNodes: true,
      showPermaLinkBox:true
 		},
    dataOptions :{
      showAllRelationships: false
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
 			maxLabelLength: 35,
      nodeShowLabel:true,
      nodeShowShortId:true
 		},
    loadingBar :{
      pictureURL: "../css/img/loading.gif",
      initialLoadingPicture: true
    },
    hierarchicalLayoutVisOptions:{
      physics:  {   hierarchicalRepulsion:{nodeDistance:200}  },
      layout:   {   hierarchical: {direction:"DU", sortMethod:"directed"}}

    },
 		rootNode:{
      font:{size:14},
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
    collapsedRootNode:{
      font:{size:8},
      color:{
        border:'#FFAA00',
        background: '#e06868',
        highlight:{border:'#FFAA00', 	background: '#e06868',},
        hover: {border: '#FFAA00', 	background: '#e06868',}
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
 			onSelectEdge: onSelectEdge,
      onClick: onClick
 		}
 	};

  var mainDiv=null
  var LoadingAnimation=true
 	/***********************************END of variable definition***********************************/



 	/*
 	 * - Document ready function. Here, by JQuery standard, all interactions with parts of the DOM/HTML are defined
 	 * - Since some elements are added dynamically and are not there at the time of DOM creation, also there eventhandlers are NOT in this function but where ever these elements are added to the DOM
 	 */
 	function startupvis(termToFetch) {
 		//TO check if the URL contains any "ed=" elements, because if so, this is a permalink and has to processed differently
 		var url=document.URL;

 		//if we can not find the ed link, we are not trying to load a permalink so just keep going the standard way and fetch data
 		if (url.indexOf("ed=")===-1)
 		{      fetchData(termToFetch);}
 		//We found parameters in the URL so somebody wants to reload a graph via permalink
 		else
 		{
 			//Split the string along the "&&" and fetch data for each substring
 			var params=url.substring(url.indexOf("ed=")+3, url.length);
 			params=params.split("&&");
 			params.forEach(function(e){
 				if (e!=="")
 					fetchData(e); // removed parseIRI, just so u know
 			})
 		}

    initializeNetwork();

    if (networkOptions.displayOptions.showButtonBox===true)
 			initializeIButtonBox();

    if (networkOptions.displayOptions.showInfoWindow===true)
      initializeInfoWindow();

 	}


 	function initializeIButtonBox(){
 		var htmlString='<div id="buttonBoxWrapper"><div id="buttonBox"><input id="Cluster" class="btn btn-default" type="submit" title="Click this button to cluster nodes by relationship and parent. Clusters help you to have a clear view if many nodes are expended!" value="Create clusters"/>';
 		htmlString+='<input id="UnCluster" class="btn btn-default" type="submit" title="Click this button to open all clusters - this has only and effect in case you clustered nodes before!" value="Open all clusters" />';
 		htmlString+='<input id="TogglePhysics" class="btn btn-default" type="submit" title="Click this button to turn on or off the physic engine. With physics turned off you can freely drag nodes around the screen and position them the way you like it." value="Turn off physics"/>';
 		htmlString+='<input id="ChangeLayout" class="btn btn-default" type="submit" title="Click this button to switch between dynamic and hierarchical layout" value="Hierarchical layout"/>';
 		htmlString+='<input id="LookUpNodeTextfield" title="You can search for a node in the graph, enter its label here!" type="text" placeholder="Search node"/> <input id="LookUpNodeButton" title="Click this button to find a node after you typed its label in the textfield" class="btn btn-default" type="submit" value="Search Node"/></div></div>';
 		mainDiv.append(htmlString);

 		/*Onclick handler for Buttons */
 		jQuery("#Cluster").on("click", cluster);
 		jQuery("#UnCluster").on("click", unclusterAllNodes);
 		jQuery("#TogglePhysics").on("click", togglePhysics);
 		jQuery("#ChangeLayout").on("click", changeLayout);

 		/*
 		 * As soon as the user focuses on the Textfield, a list for autocompletion is build. The list contains all nodes of the current graph
 		 */
 		var awesomplete=new Awesomplete(document.getElementById("LookUpNodeTextfield"), {list:[], minChars:1, autoFirst:true});
 		jQuery("#LookUpNodeTextfield").on("focus", function(){

 			//Construct an list of all nodes/ids that are shown in the Graph
 			var list=[];
 			autoCompleteList={};
 			nodes.forEach(function(e){
 				autoCompleteList[e.label]=e.id;
 				list.push(e.label);
 			});
 			awesomplete.list = list;
 		});

 		jQuery("#LookUpNodeButton").on("click", function(){
 			var LookUpNodeTextfield=jQuery("#LookUpNodeTextfield");
 			var nodeToFocus=autoCompleteList[LookUpNodeTextfield.val()];
 			//IF length===1 then the we can zoom to the node (it is not part of a cluster). Focus the node and show the information about the cluster
 			if (network.findNode(nodeToFocus).length===1)
 			{
 				network.focus(nodeToFocus, networkOptions.ZoomOptions);
 				network.selectNodes([nodeToFocus]);
 				showNodeInfo(nodeToFocus);
 			}
 			//The node is part of a cluster, so we don't zoom to the node but to the cluster and show the relevant information
 			else
 			{
 				var tmpClusterNode=network.findNode(nodeToFocus)[1].id;
 				network.focus(tmpClusterNode, networkOptions.ZoomOptions);
 				network.selectNodes([tmpClusterNode]);
 				showClusterInfo(tmpClusterNode);
 			}
 			LookUpNodeTextfield.val("");
 			LookUpNodeTextfield.blur();
 		})

 	}


 	function initializeInfoWindow(){
 		var htmlString='<div id="SecondWindow"><div id="infoWindow"><h6>Welcome to the ontology visualisation!</h6></div>'
    htmlString+='<div id="infoWindowSub">This tool should help you to explore an ontology in a different way. Some notes:<br>- This window is updated whenever you select a node or edge of the graph, showing you the description and all other available information<br>- You can interact with the graph. Use the buttons on the bottom of this window as well as below the graph to do so. Double clicking on a node expands the node<br>-All buttons and other elements of the page show tooltips! Make use of this function if you are unsure of a functionality!<br>- If you need further help, please visit the documentation page!</div></div>';

    // Adding two checkboxes to change the nodelabel to iri/label
    if (networkOptions.displayOptions.showPermaLinkBox===true){
      htmlString+='<div id="labelPermaLinkBox" style="text-align:center;" title="Decide if you want to display the the label, the short id or both as title of the nodes!">';
      htmlString+='<div id="Permaanwser" style="text-align:center;"><input id="Permalink" title="Get a static URL of this graph - so you can return or share it" class="btn btn-default" type="submit" value="Get permalink to this graph"/></div>';
      htmlString+="<hr style='margin-left: 50px; margin-right:50px'/>Show label <input type='checkbox' id='label' checked> ";
      htmlString+="Show id <input type='checkbox' id='iri' checked><hr style='margin-left: 50px; margin-right:50px'/></div>";
    }

    mainDiv.append(htmlString);

    //Adding listener to label/iri
    jQuery('#iri').on("click", function(event){
      var val=jQuery('#iri').prop('checked')
      networkOptions.appearance.nodeShowShortId=val;
      adjustLabel();
    })

    jQuery('#label').on("click", function(event){
      var val=jQuery('#label').prop('checked')
      networkOptions.appearance.nodeShowLabel=val;
      adjustLabel();
    })

    //Finally, add also a Listener to the Permalink Button
       jQuery("#Permalink").on("click", function()
       {
         var rootNodes=window.location.href+"&&ed=";
         root.forEach(function(e){
           rootNodes+=e+"&&";
         });
         jQuery("#Permaanwser").html('<style="text-align:center;"><input type="text" title="Copy and paste this link to return to this graph! You can easly share it via email as well!" name="Permalink" value="'+rootNodes+'">')
       });


 	}

 	/*
 	 * Uncluster all nodes of the network. Therefore run through all nodes, check if they are a cluster and if so, open them
 	 */
 	function unclusterAllNodes(){
 //Go through all Nodes of the network, check each if it is a cluster and if so release the cluster
 		var tmp=network.body.nodeIndices;
 		tmp.forEach(function(e) {
 			if (network.isCluster(e)===true);
 				network.openCluster(e);
 		});
 	}
 	/*
 	 * Function is activated by button press or if a new fetch data event retrieves a lot of data.
 	 * - The function builds all posible clusters, using the vis js cluster function and the cluster Array (which contains all possible clusters: Possible Clusters are all relationships from each parent)
 	 * - After building the clusters, the layout/style is adjusted
 	 */
 	function cluster(){
 		//Go through The Cluster array, apply the Cluster join Condition to calculate what should be in which cluster
 		//Change some things for those nodes that are actually in a cluster
 		clusterArray.forEach(function(e){

 			var Clusteroptions = {joinCondition:function(nodeOptions) {
 				if (e===nodeOptions.cluster)
 					return true;
 				else
 					return false;
 			},
 				clusterNodeProperties:{id:e, label:e},
 				//	clusterEdgeProperties:{physics:false, dashes:true, shadow:false},
 				clusterEdgeProperties: networkOptions.clusterOptions.clusterEdgeProperties,


 				//This build in functionality offers the possibility to change the ClusterOptions dynamically
 				processProperties: function(clusterOptions, childNodes, clusterEdges){
 					var tmpLabel="";
 					var shape=networkOptions.clusterOptions.otherClusterSymbole;
 					var tmpe=clusterOptions.label;

 					var y=e.substring(tmpe.indexOf("__")-2, tmpe.indexOf("__"));
 					var x=e.substring(tmpe.indexOf("__")+2, tmpe.length);


 					if (x==="is a" && y==="om")
 					{tmpLabel="children";
 						shape=networkOptions.clusterOptions.parentClusterSymbole;

 					}
 					if (x==="is a" && y==="to")
 					{
 						tmpLabel="parent";
 						//shape="triangleDown"
 						shape=networkOptions.clusterOptions.parentClusterSymbole;
 					}
 					if (x!=="is a")
 						tmpLabel=tmpe.substring(tmpe.indexOf("__")+2, tmpe.length);

 					clusterOptions.label=tmpLabel+"(#"+childNodes.length+")";

 					clusterOptions.title="This cluster '"+tmpLabel+"' contains "+childNodes.length+" nodes";
 					//clusterOptions.mass=childNodes.length;
 					clusterOptions.mass=networkOptions.clusterOptions.clusterMass;
 					clusterOptions.shape=shape;

 					//Adjust the cluster size to the child nodes in that cluster
 					clusterOptions.size=15+childNodes.length;

 					//If the cluster node has too many nodes, we fix the size at a maximum
 					if (clusterOptions.size>networkOptions.clusterOptions.clusterMaxAppearanceSize);
 						clusterOptions.size=networkOptions.clusterOptions.clusterMaxAppearanceSize;

 					if (networkOptions.appearance.colorMap.length>=relationships.length)
 						clusterOptions.color=networkOptions.appearance.colorMap[indexof(relationships,x)];

 					return clusterOptions;
 				}};

 			network.clustering.cluster(Clusteroptions);
 		})



 	}

 	/*
 	 * Unclusters (=opens) a certain Cluser by (Cluster) id
 	 */
 	  visualisation.prototype.unclusterSingeCluster=function unclusterSingeCluster(id){
 		network.openCluster(id);
 	}

 	/*Function to handle the click on the the ChangeLayout button
 	 * - Apply new options to the network (hierarchical layout option)
 	 * - Change the Text of (some?) Buttons
 	 */
 	function changeLayout(){
 		var options={};
 		if (jQuery("#ChangeLayout").val()==="Hierarchical layout")
 		{
      LoadingAnimation=true;

      /*
      options={
          physics:  {   hierarchicalRepulsion:{nodeDistance:200}  },
          layout:   {   hierarchical: {direction:"DU", sortMethod:"directed"}}
    }*/


      //network.setOptions(options);
      network.setOptions(networkOptions.hierarchicalLayoutVisOptions);

 			//Since REACTIVATING the dynamic layout activates physic, we have to change the text of the physic button here
 			jQuery("#TogglePhysics").val("Turn off physics");
 			jQuery("#ChangeLayout").val("Dynamic layout");
 		}

 		else
 		{
      LoadingAnimation=true;
 			jQuery("#ChangeLayout").val("Hierarchical layout");
 			//options = {layout: {   hierarchical:{enabled: false} }  };
 			//network.setOptions(options);
      network.setOptions(visNetworkOptions);
 		}
 		//Try to fit the network after layout change
 	//	network.fit();
 	}

 	/*
 	 * Function to handle the button click "Turn Physics on/off"
 	 * - Change the text of the button
 	 * - Turn on or off physic and update the network
 	 */
 	function togglePhysics(){
 		var options={};
 		if (jQuery("#TogglePhysics").attr("value")==="Turn off physics")	{
 			jQuery("#TogglePhysics").val("Turn on physics");
 			options={physics: {"enabled": false}}; network.setOptions(options);	}
 		else {
 			jQuery("#TogglePhysics").val("Turn off physics");
 			options={physics: {"enabled": true}}; network.setOptions(options);}
 	}


  //Run through the array and look if we have a a certain id saved in the 'to' part of it
  function findWhereto(object, id){
    for (var i=0; i<object.length;i++)
      {
        if (object[i].to===id)
            return object[i]
        }
        return -1;
    }



function collapseNode(node){
//Only if there is more than one root node left!
if (root.length>0)
  {

  var tmpNodes=network.getConnectedNodes(node);
  //go through all connecting nodes, remove them if they are NOT part of root! (=other extended nodes should not be removed!)
  for (var i=0;i<tmpNodes.length;i++)
      {
        //remove by group instead of root
        if (nodes.get(tmpNodes[i]).group!=="root")
        {
            nodes.remove(tmpNodes[i]);
        }

      }



      var tmpOptions=networkOptions.collapsedRootNode;
      tmpOptions["id"]=node;
      tmpOptions["collapsed"]=true;
      graphdataset.nodes.update(tmpOptions);

      }
      else {
        //console.log("I do not collapse if there is only one root node left");
      }
}

function adjustLabel(){

if (networkOptions.appearance.nodeShowLabel && networkOptions.appearance.nodeShowShortId)
{
nodes.forEach(function(e){

  //Getting rid of long strings - cut really long labels (>30)
  if (e["textlabel"].length>networkOptions.appearance.maxLabelLength)
      {e["label"]=e["textlabel"].substring(0,networkOptions.appearance.maxLabelLength).concat("...");}
  else
      {e["label"]=e["textlabel"]}

  e["label"]=e["label"].concat("\n").concat(parseIRI(e["iri"]))
  nodes.update({id:e["id"], label:e["label"]})
  })
}

if (networkOptions.appearance.nodeShowLabel && !networkOptions.appearance.nodeShowShortId){
  nodes.forEach(function(e){
    //Getting rid of long strings - cut really long labels (e.g >30)
    if (e["textlabel"].length>networkOptions.appearance.maxLabelLength)
        {e["label"]=e["textlabel"].substring(0,networkOptions.appearance.maxLabelLength).concat("...");}
    else
      {e["label"]=e["textlabel"]}

    nodes.update({id:e["id"], label:e["label"]})
  })
}

if (!networkOptions.appearance.nodeShowLabel && networkOptions.appearance.nodeShowShortId)
{
  nodes.forEach(function(e){
    nodes.update({id:e["id"], label:parseIRI(e["iri"])})
  })
}

if (!networkOptions.appearance.nodeShowLabel && !networkOptions.appearance.nodeShowShortId){
  //console.log("Wrong option submitted! Nothing will change");
}

}


/*This function removes the special character / in a relationship (=edge) label. At the moment, this is the only special character that gives us problems*/
function adjustEdgeLabel(tmpstring){
return  x=tmpstring.replace("/","_");
}


 	function fetchGraphData(linkToGraph){
 		/*Once obtained the correct URL to the graph data, call this URL and fetch the data*/
 		jQuery.getJSON(linkToGraph,function (data){
 					/*
 					 * Start IF branch, check if we got data from the getJSON call, if so, prepare the data for further use
 					 */
 					if (data.nodes.length!=0 && data.edges.length!=0)
 					{
 						var nodesTMP=data.nodes;
 						var edgesTMP=data.edges;

            //If the node is not part of the root array, than add it now (collapsed if they get reexpanded might already be part of the root array)
            if (jQuery.inArray(nodesTMP[0].iri, root)===-1)
                {	root.push(nodesTMP[0]["iri"]);  }

 						//Go through all nodes and prepare them for the graph, e.g change the iri to id cause that corresponce with from/to
 						nodesTMP.forEach(function(e)
 						{

 							if (e["iri"]!==undefined)
 							{ e["id"]=e["iri"];
 								e["title"]=e["iri"];
 							}

              if (e["label"]!=undefined)
              {  e["textlabel"]=e["label"]  }

              if (e["iri"]==undefined || e["label"] == undefined)
                {
                  var msg="ERROR, the fields iri and lable have to be defined for each NODE!"
                  printMsgToScreen(msg);
                  console.log(msg)
                }


 							//Check if the node is already part of the network, if not add it
 							if (graphdataset.nodes.get(e.id)===null)
 								graphdataset.nodes.add(e);
 						});

              adjustLabel();

 						/*
 						 * - Go through edges, change the property name from source/target to from/to
 						 * - Save all the relationships in the relationships array. The relationships correspond to the labes of the edges
 						 * - Save the edge if and only if it is not part of the graph already
 						 */
 						edgesTMP.forEach(function(e)
 						{
 							if (e.source!==undefined)
 							{
 								e["from"]=e.source; delete e.source;

 							}
 							if (e.target!==undefined)
 							{
 								e["to"]=e.target;    delete e.target;
 							}

 							e["id"]=e["from"]+e.label+e["to"];


              //Sanitize the label of edges (remove special character because it gives us problems)
              e["label"]=adjustEdgeLabel(e["label"])

 							nodes.update({id:e["from"], group:e["label"]});

 							if (indexof(relationships, e["label"])===-1)
 							{
 								relationships.push(e["label"]);
 								//Dynamically pick the right color for the groups
 								var options={groups:{}};
 								var tmp={color:{}};
 								//Check for length to prevent an error if the relationships array is bigger than the color map
 								if (networkOptions.appearance.colorMap.length>=relationships.length)
 									tmp.color=networkOptions.appearance.colorMap[indexof(relationships,e["label"])];

 								options.groups[e["label"]]=tmp;
 								network.setOptions(options);
 							}



 							//Coloring of the edges depending on the relationship the describe
 							//To thread the edges between root node especially, we would need a check
 							// But we have to go through all edges again and further down the code because here we dont know about all root nodes YET
 							if (networkOptions.appearance.colorMap.length>=relationships.length)
 								e["color"]=networkOptions.appearance.colorMap[indexof(relationships,e["label"])];

 							//Apply Clusters to node depending on the group and the direction of the relationship
 							var tmpNode=nodes.get(e["from"]);
 							if (tmpNode.group!=undefined ){
 								nodes.update({id:e.from, cluster: last(root)+"from__"+tmpNode.group});

 								//If the id is not part yet of the clusterArray, save it there
 								if (indexof(clusterArray, last(root)+"from__"+tmpNode.group)===-1)
 								{clusterArray.push(last(root)+"from__"+tmpNode.group);}
 							}

 							//Check if the edge is already part of the network, if not add it
 							if (graphdataset.edges.get(e.id)===null)
 								graphdataset.edges.add(e);

 						});


 						/*
 						 * - Go through all nodes again and group those nodes that have not been grouped yet (e.g newly added nodes)
 						 * - Apply Cluster to nodes, we cluster by group as well as root not so each cluster is attached to its root
 						 * - Add Each Cluster also to the global Cluster array so we can apply the cluster join condition (? Could this done better with Cluster by Connection+Join condition ?)
 						 */
 						nodes.forEach(function(e){
 							if (e.group===undefined)
 							{

                //e.group=_.findWhere(edgesTMP, {to:e.id}).label;
                e.group=findWhereto(edgesTMP, e.id).label;
 								nodes.update({id:e.id, group: e.group});
 							}

 							// If a NODE is not part of a cluster yet and is not root, update the node's cluster
 							if (e.cluster===undefined &&e.group!="root"){
 								//Clustering applied - save in extra Array clusters all groups of clusters
 								nodes.update({id:e.id, cluster: last(root)+"to__"+e.group});
 							}

 							//Add the group the to cluster array if the group is not root (Root nodes should not be part of any clusters)
 							if(e.group!=="root"){
 								if (indexof(clusterArray, last(root)+"to__"+e.group)===-1)
 								{		clusterArray.push(last(root)+"to__"+e.group);	}}  });

 						/*
 						 * - Update the root elements, which means going through the root array, then setting the group, the cluster and additional options
 						 * 	This is important because we want all root elements no to be part of any cluster, additional options give the opportunity to further thread root elements special
 						 * - Second step, special treatment for the edges between root nodes, so they are not longer removed by user actions
 						 */
 						root.forEach(function(e){
              //Get options from networkOptions, add root specific stuff and update the node
              //BUT only update, if the root node is NOT collapsed!

              if (nodes.get(e).collapsed===false || nodes.get(e).collapsed===undefined)
              {
              var tmpRootOptions=networkOptions.rootNode;
              tmpRootOptions["id"]=e;
              tmpRootOptions["group"]="root";
              tmpRootOptions["cluster"]=undefined;
              nodes.update(tmpRootOptions);
              }
              else
              {   //seems to be necessary to overwrite the options of collapsedNodes
                  var tmpRootOptions=networkOptions.collapsedRootNode;
                  tmpRootOptions['id']=e;
                  tmpRootOptions["group"]="root";
                  tmpRootOptions["cluster"]=undefined;
                  nodes.update(tmpRootOptions);
              }

              //Old version, the more generic thing is above - if it is fine, we can delete the line below
              //nodes.update({id: e, group:"root", cluster: undefined, mass:networkOptions.rootNode.rootMass, color: networkOptions.rootNode.color, font: networkOptions.rootNode.font});


 							//Go through all the connecting Edges of root nodes, if an edge connects two root edges, mark the edge as "special" (set Flag, change label and color)
 							network.getConnectedEdges(e).forEach(function(e){
 								var tmpEdge=edges.get(e);
 								if (tmpEdge!==null && root.indexOf(tmpEdge.to)!==-1 && root.indexOf(tmpEdge.from)!==-1)
 								{
 									//Check if we already changed that edge, if so we can skip this step
 									if (tmpEdge.connectingFlag!=true)
 										edges.update({id:e, connectingFlag: true, label:tmpEdge.label+" (*)", color: networkOptions.rootNode.connectingEdges.color, width: networkOptions.rootNode.connectingEdges.width});
 								}

 							})
 						});


 						//Call this function to update the legend every time that new data is fetched because the legend dynamically is adjusted to the relationships that are part of the vizualisation
 						if (networkOptions.displayOptions.showLegend===true)
 							updateLegend();


 						//If the new data is above a certain size cluster immediately
 						if (data.nodes.length>networkOptions.clusterOptions.automaticClusterThreshold)
 							cluster();
 						//Try to fit the network after new data is fetched
 						network.fit();
 					}

 					/*
 					 * Else branch - If nodes and edges are empty, something went wrong with data fetching and graph can not be drawn
 					 */
 					else  	{
            console.log("Could not fetch data! Something went wrong with the webservice call! Has the JSON the expected structure?");
            printMsgToScreen("Could not parse JSON as expected")
          }

 				})//End of First json call
 				.fail(function (){
          console.log("Failed to do the second webservice call! Is the server down? Tried to reach "+linkToGraph);
          printMsgToScreen("Failed to do the second webservice call! Is the server down? Tried to reach "+linkToGraph+" for data")
      })



 	}


 	/*
 	 * - The function fetches data via a webservice call, if successful process and prepare the data for further use
 	 *  @param: term - represents the term we ask the webservice for data e.g. an Uberon ID
 	 */
 	function fetchData(term){
    term=encodeURIComponent(term);

 		if (networkOptions.webservice.OLSschema===true)
 		{
 			jQuery.getJSON(networkOptions.webservice.URL+term, function (data2){
 				var linkToGraph=data2._embedded.terms[0]._links.graph.href;
 				//This unfocus the textfield. This is done because focusing into the textfield triggers an update of the autocomplete list
 				//If new data is fetched, the texfield is therefore unfocused with the blur event. Re-entering it updates the autocompelte list
 				jQuery("#LookUpNodeTextfield").blur();
 				fetchGraphData(linkToGraph);

 			}).fail(function (){printMsgToScreen("Failed to do the webservice call! Is the server down? Tried to reach: "+networkOptions.webservice.URL+term);})
 		}

 		else
 		{      fetchGraphData(networkOptions.webservice.URL);  }

 	}


 	/*Function print msg
 	* Function should print msg to screen for the user to see it, used e.g. for error messages
 	*/
    function printMsgToScreen(msg){
 		var HTMLString='<div style="position:absolute; width:60%; background-color: orange;  ">'+msg
 		HTMLString+='</div>'
 		mainDiv.append(HTMLString);
 	}

 	/*
 	 * Function initialize network
 	 * - Get the container (div) out of the html where the network should be drawn
 	 * - initialize the network by creating a new network with the parameters container, dataset and options
 	 * - define events (e.g. onclick) for the network and how it should behalf in case of such an event
 	 */
 	function initializeNetwork()
 	{

 		htmlString='<div id="vis_network" style="height:200px; display:none"></div>';

    //Add a "spinner" loading div in case the option says so
    if (networkOptions.loadingBar.initialLoadingPicture){
      htmlString+='<div id="spinner"><img id="loadingIMG" alt="Loading..." src="'+networkOptions.loadingBar.pictureURL+'"></div>'
    }

    htmlString+='<div id="Legend"></div>';
    mainDiv.append(htmlString);
 		var container = document.getElementById('vis_network');

 		//get the height of the available div and start the network with it
 		//var height=jQuery("#vis_network").height()+"px";

 		network = new vis.Network(container, graphdataset, visNetworkOptions);


    //Register the events for loading bar IF flag is true
    if (networkOptions.loadingBar.initialLoadingPicture===true)
    {
    network.on("startStabilizing", function(params){
        //If the status of the vis is calling for loading bar, show it (e.g. changing from dynamic to hierarchical layout)
        if (LoadingAnimation===true){
          $("#vis_network").hide();
          $("#spinner").show();
        }
      })

    network.on('stabilized', function(params){
      //Network is stable and the animation is running, so hide the spinner and show the network
      if (LoadingAnimation===true){
        $("#spinner").hide();
        $("#vis_network").show();
        LoadingAnimation=false;
        network.fit();  //Make the network fit after it is stabilized
        }
      })
    }

    //In case we are not waiting for the animation, display the network right away
    else{
        $("#vis_network").show();
    }


 		//Make the very first view fit the screen (=adjust zoom right away)
 		//network.fit();

 		//Event Handling for a selectNode event
 		network.on("selectNode", function(params){networkOptions.callbacks.onSelectNode.call(this,params)});
 		//Event handling for a double click on a node or cluster
 		network.on("doubleClick", function(params){networkOptions.callbacks.onDoubleClick.call(this,params)});
 		//Event handling for the selection of an Edge
 		network.on("selectEdge", function(params){networkOptions.callbacks.onSelectEdge.call(this, params.edges[0])});
    //Overwrite the onClick function
    network.on("click", function(params){;networkOptions.callbacks.onClick.call(this, params)});


    //After startup, select a Node to highlight and update InfoWindow with this node
 		//network.selectNodes(root[0]);
 		//showNodeInfo(root[0]);
 	}


 	/*Function to handle the default behavior for Doubleclick events*/
 	function onDoubleClick(params)
 	{
 		//Was the double click on a node or just somewhere within the canavs?
 		if (typeof params.nodes[0]!=="undefined")
 		{
 			//Open a Cluster after double click
 			if (network.isCluster(params.nodes[0]))
 			{unclusterSingeCluster(params.nodes[0]);}
 			//If you double click on a node then expend that Node
 			else
 			{
 				//Only try to fetch data, if the node is not already part of the root array. If so, we expanded it before and there is no need to call the function again
 				if (root.indexOf(params.nodes[0])===-1 || graphdataset.nodes.get(params.nodes[0]).collapsed)
        {
          //Set collapsed to false, since we we gonna expand this node now
          graphdataset.nodes.update({id:params.nodes[0], collapsed: false});
 					fetchData(params.nodes[0]);

        }
        //Node is expended, so we want to collapse the node now with this double click!
        else
          {
            collapseNode(params.nodes[0]);
        }
 			}
 		}
 	}

 	/*Function to handle the default behavior for onSelectNode*/
 	function onSelectNode(params){
 		if (network.isCluster(params.nodes[0]))
 			showClusterInfo(params.nodes[0]);
 		else
 			showNodeInfo(params.nodes[0]);
 	}

  /*Function to handle the behavior for the onClick event, default is we do not do anything with the onclick event*/
  function onClick(params){}

 	/*Function to handle the default behavior for onSelectEdge*/
 	function onSelectEdge(edgeId){showEdgeInfo(edgeId);}


 	/*
 	 *The function parses the short id out of a term. This is done by reversing the string, parsing the string from start to the first / and then reversing the new substring again
 	 */
 	function parseIRI(term){
    if (term.indexOf("/")!=-1)
    {
      var reversed = term.split("").reverse().join("");
 		  var tmp=reversed.substring(0,reversed.indexOf("/"));
 		  return tmp.split("").reverse().join("");
    }
  else {
      return term;
    }
  }



  /* Function to return the index of an certain object in an array of objects, if it is in there */
  function indexof(object, value) {
    var i=0;
    for (; i<object.length; i++) {
      if (object[i]===value)
        {return i;}
    }
    return -1
  }


  /* Function to return the last element of an array of objects*/
  function last(object)
  { return object[object.length-1]  }


 	/*
 	 * This function provides information about the selected edge, when a edge is selected
 	 */

 	function showEdgeInfo(edgeId){
 		var twoNodesArray=network.getConnectedNodes(edgeId);

 		jQuery("#infoWindow").html("<h6>Edge selected</h6>");
 		jQuery("#infoWindowSub").empty();

 //Edge connects 2 normal nodes
 		if (nodes.get(twoNodesArray[0])!==null && nodes.get(twoNodesArray[1])!==null)
 			jQuery("#infoWindowSub").append("This edge connects the node <strong>"+nodes.get(twoNodesArray[0]).label+"</strong> with the node <strong>"+nodes.get(twoNodesArray[1]).label+"</strong>");
 //One side of the edge is a cluster, so we get null as result and have to change our response to that
 		else
 		{
 			if (nodes.get(twoNodesArray[0])!==null)
 			{
 				jQuery("#infoWindowSub").append("This edge connects the node <strong>"+nodes.get(twoNodesArray[0]).label+"</strong> with a <strong>cluster</strong>");
 			}
 			if (nodes.get(twoNodesArray[1])!==null)
 				jQuery("#infoWindowSub").append("This edge connects a <strong>cluster</strong> with the node <strong>"+nodes.get(twoNodesArray[1]).label+"</strong>");
 		}


 	}

 	/*
 	 * This function can provide information about a selected cluster
 	 */
 	function showClusterInfo(clusterId){
 		var infoWindowSub=jQuery("#infoWindowSub");
 		jQuery("#infoWindow").html("<h6>The selected cluster contains the following nodes</h6>");
 		infoWindowSub.empty();
 		var htmlString="";

 		htmlString="<i>Click on the node label to fetch data for this node and update the graph</i><br><br>";

 		network.getNodesInCluster(clusterId).forEach(function(e){
 			htmlString+="- <a class='clusterLink' data="+e+" href="+parseIRI(e)+">"+graphdataset.nodes.get(e).label+"</a> <small>("+parseIRI(e)+")</small><br>";
 		});

 		htmlString+='<br><br><br><hr style="margin-left: 79px; margin-right:84px"/>';
 		htmlString+='<div style="text-align:center;"><input id="ExpandClusterButton" class="btn btn-default" type="submit" title="Click here to uncluster this cluster. The same result can be achieved by double clicking on a cluster in the graph!" value="Expand this cluster"/> ';
 		htmlString+='<input id="FocusOnCluster" class="btn btn-default" type="submit" title="Click this button to zoom to the selected node" value="Zoom to this cluster"/> ';

 		infoWindowSub.append(htmlString);

 		jQuery(".clusterLink").on("click", function(event){
 			event.preventDefault(); // we don't want to link at the moment
 			//alert("clicked on a link, we could go on from here but we dont at the moment "+jQuery(this).attr("data")+" "+event.currentTarget.attributes.href)

 			unclusterAllNodes();
 			var nodeToFocus=jQuery(this).attr("data");

 			//TO fetch data, we use at the moment short for of id (=label)
 			fetchData(parseIRI(jQuery(this).attr("data")));

 			network.selectNodes([nodeToFocus]);
 			showNodeInfo(nodeToFocus);
 			network.focus(nodeToFocus);
 		});


 		jQuery("#FocusOnCluster").on("click", function() {

 			//network.focus(clusterId, ZoomOptions)

 			var tmpClusterNode=network.findNode(clusterId)[1].id;
 			network.focus(tmpClusterNode, networkOptions.ZoomOptions);
 			network.selectNodes([tmpClusterNode]);
 			showClusterInfo(tmpClusterNode);
 		});



 		jQuery("#ExpandClusterButton").on("click", function() {    unclusterSingeCluster(clusterId); })

 	}

 	/*
 	 * Fills infoWindow with information about the clicked node
 	 * An additional webservice call is necessary to fetch the data, JQuery is used to update the window with the data
 	 */
 	function showNodeInfo(nodeId){

 		var id=encodeURIComponent(nodeId);
 		jQuery.getJSON(networkOptions.webservice.URL+id, function(inputdata){
 			var data=inputdata._embedded.terms[0];

 			jQuery("#infoWindow").html("<h6>"+data.label+"</h6>");

 			//Check if the term is obsolete and if so, tell that to the user!
 			var htmlString="";

 			if (data.is_obsolete===true)
 			{
 				htmlString+="<font color='red'>ATTENTION: Term is obsolete</font><br><br>"
 			}

 			//Check if a description is available, depending on the check update the infoWindowSub differently
 			if (data.description!==null)
 				htmlString+="<strong>Description: </strong>"+data.description;
 			else
 				htmlString+="<i>Sorry, no description available</i>";

 			htmlString+="<br>";

 			//Check if Database cross references are available
 			if (data.database_cross_references!==undefined)
 				htmlString+="<br><strong>Database cross references:</strong> "+data.database_cross_references;

 			//Check if there are synonyms
 			if (data.synonyms!==null)
 				htmlString+="<br><strong>Synonyms:</strong> "+data.synonyms;

 			//Short_form and IRI are always present, so no check is needed
 			htmlString+="<br><i><strong>Short id:</strong></i> "+data.short_form+" (<i>iri: </i><small>"+data.iri+"</small>)";

 			htmlString+='<br><br><br><hr style="margin-left: 79px; margin-right:84px"/>';
 			htmlString+='<div style="text-align:center;"><input id="ExpandNodeButton" class="btn btn-default" type="submit" title="Click here to expand this node. The same result can be achieved by double clicking on a node in the graph!" value="Expand this node"/> ';
 			htmlString+='<input id="FocusOnNode" class="btn btn-default" type="submit" title="Click this button to zoom to the selected node" value="Zoom to this node"/> ';

      /**** To be removed, if we don't want to have this here*/
      //htmlString+='<input id="childrenListen" class="btn btn-default" type="submit" title="Show list of all children" value="ShowChildren"/>'
      /*****///

      htmlString+='<input id="goToOLS" class="btn btn-default" type="submit" title="Click here to go to the OLS page of this term" value="Find this term in OLS"/></div>';

 			jQuery("#infoWindowSub").html(htmlString);

 			jQuery("#FocusOnNode").on("click", function() {
 				var tmpNode=network.getSelection().nodes;
 				if (tmpNode.length!=0)
 					network.focus(tmpNode[0], networkOptions.ZoomOptions)
 			});



 			jQuery("#ExpandNodeButton").on("click", function() {
 				//Same functionality as in network.on("doubleclick")
 				//Open a Cluster after double click
 				if (network.isCluster(nodeId))
 				{unclusterSingeCluster(nodeId);}
 				//If you double click on a node then expend that Node
 				else
 				{
 					//Only try to fetch data, if the node is not already part of the root array. If so, we expanded it before and there is no need to call the function again
 					if (root.indexOf(nodeId)===-1)
 						fetchData(nodeId);
 				}
 			});


 			jQuery("#goToOLS").on("click", function () {
 				var termURL=document.URL;
 				window.open(termURL.substring(0,termURL.indexOf("/graph"))+"?iri="+encodeURIComponent(nodeId));})

 		}).fail(function () {printMsgToScreen("Error with the webservice call for "+networkOptions.webservice.URL+id+"<br><br> The server might be down, you might not use a OLS structured webservice or something else went wrong!");})


 	}


 	/*
 	 * The function is called whenever the user activates or deactivates the visibility for a relationshiptype in the legend
 	 * First the target (=relationshiptype) is determined from the legend, than a specific view is created by using the rule (node.group===selected/deselected relationshiptype)
 	 * Then the nodes are added or removed from the network but stored in an specific dataset (removed nodes) so they can easily be added again to the 'active' network
 	 */

 	function updateDataView(tmpID, checked){
 		var view;
 		var edgeView;

 		clusterArray.forEach(function(e){
    //Try to find these potential cluster
 			if (tmpID===e.substring(e.indexOf("__")+2,e.length))
 			{
 				if (network.isCluster(e))
 				{	unclusterSingeCluster(e);}
 			}
 		});


 //If the user sets the relationship type to false, we have to remove the view from the nodes (active dataset). The removed nodes get stored in another dataset (removedNodes) so they can be added again easily later if needed
 		if (checked===false)
 		{
 			//Construct the view - go through nodes and apply filter. Elements for which the filter is true are part of the view
 			view = new vis.DataView(nodes, {
 				filter: function (item) {
 					return (item.group===tmpID);
 				}
 			});

 			//Construct the view for EDGES - go through all edges and apply the filter. Eements for which the filter is true are part of the view.
 			edgeView=new vis.DataView(edges, {
 				filter: function (item) {
 					return (item.label===tmpID);
 				}
 			});

 			//Shift the filtered nodes to the removed Nodes Dataset, the filtered Edges to the removedEdges Dataset
 			removedNodes.update(view.get());
 			removedEdges.update(edgeView.get());

 			//Remove node and edges from the datasets that are displayed in the graph
 			nodes.remove(view.getIds());
 			edges.remove(edgeView.get());
 		}

 // If the relationshiptype is set to true, add the view from removedNodes to the node dataset (the one that is displayed in the network)
 		else
 		{
 			//Construct the view - go through removeNodes and apply filter. Elements for which the filter is true are part of the view
 			view = new vis.DataView(removedNodes, {
 				filter: function(item) {
 					return (item.group===tmpID)
 				}
 			});

 			edgeView=new vis.DataView(removedEdges, {
 				filter: function (item) {
 					return (item.label===tmpID);
 				}
 			});

 			//Add the filtered expression to the the nodes and edges that are displayed
 			nodes.update(view.get());
 			edges.update(edgeView.get());

 			//Remove the filtered nodes and edges from the removedNodes and removedEdges Datasets
 			removedNodes.remove(view.getIds());
 			removedEdges.remove(edgeView.getIds());
 		}


    //after updating the dataview, labels have to be adjusted (In case that the user changed the options in the meantime)
    adjustLabel();
 	}

 	/*
 	 * Function updateLegend
 	 * - Updates the Legend div of the html e.g. relationships
 	 */
 	function updateLegend(){
 		var Legend=jQuery("#Legend");
 		Legend.empty();
 		var tmp="";

 //Preparing the html of the Legend - which means adding the table, the relationship names, the canvas as well as the check boxes for every table row
 		tmp+='<h6 title="How are relationships and colours connected">Legend</h6>';
 		tmp+='<table><tbody><tr><td><strong title="List of relationships that is displayed in the graph">Relationship</strong></td><td><strong title="The color a certain relationship is represented by">Color</strong></td><td><strong title="You can change the visibility of relationship types ">Visibility</strong></td></tr>';
 		tmp+='<tr><td title="Relationships in between extended nodes are special - those relationships are always visible!">Extended nodes (*)</td><td><canvas id="canvas_root" width="30" height="15"></canvas></td><td>-</td></tr>';

 		relationships.forEach(function(e){
 			tmp+="<tr><td>"+e+'</td><td><canvas id="canvas_'+e+'" width="30" height="15"></canvas></td><td><input type="checkbox" class="Legendoptions" name="'+e+'" id="visible_'+e.replace(/\s+/g, '')+'" checked></td></tr>';
 		});

 //Add a Deselect all Box (Do we even need it?)
 		tmp+='<tr><td title="This option is useful if you only want to display the path you extended! Or revert the effect and display everything!">Select/Deselect all</td><td></td><td><input type="checkbox" id="special" unchecked></td></tr>';

 		tmp+="</tbody></table>";

 //From here on the output of the path (=extended nodes) is constructed
 if (networkOptions.displayOptions.showListOfExtendedNodes===true)
 {
  	tmp+='<br><i title="The list contains all nodes that data was fetched for and displayed in the graph">List of extended nodes (*):</i><br>';
 		tmp+="<ul>";
 		root.forEach(function(e){
 			tmp+="<li>"+nodes.get(e).textlabel+" <small>("+(parseIRI(nodes.get(e).id))+")</small></li>";
 		});
 		tmp+="</ul>";
  }

 		Legend.append(tmp);

 //Color the root canvas
 		var c=document.getElementById("canvas_root").getContext("2d");
 		c.fillStyle=networkOptions.rootNode.color.background;
 		c.fillRect(0,0,350,100);

 //After appending the legend, the colours have to be adjusted according to the colorMap
 		relationships.forEach(function(e){
 			var c=document.getElementById("canvas_"+e).getContext("2d");

 			if (networkOptions.appearance.colorMap.length>=relationships.length)
 				c.fillStyle=networkOptions.appearance.colorMap[indexof(relationships,e)];

 			c.fillRect(0,0,350,100);

    /* Try to only show is a relationship - can be incooperated above then? */
    if (networkOptions.dataOptions.showAllRelationships===false)
    {
      relationships.forEach(function(e){
        if (e!=="is a")
        {
          var tmpid='visible_'+e.replace(/\s+/g, '')
          updateDataView(e,false);
          jQuery("#"+tmpid).prop('checked', false)
        }

      });
    }



      /* */

 			//Register event handler for visibility
 			jQuery('#visible_'+e.replace(/\s+/g, '')).on("click", function(event){
 				var target=jQuery("#"+event.target.id);
 				var tmpID=target.attr("name");
 				var checked=target.is(':checked');
 				updateDataView(tmpID,checked);
 			});


 			//EventHandler for click on SelectDeselect all checkbox. Selects//deselects all relationships and starts the updateDataView function for each relationship
 			jQuery('#special').on("click", function(event){
 				if(jQuery('#special').prop("checked"))
 				{
 					jQuery('input:checkbox.Legendoptions').prop('checked', false );
          jQuery.map(jQuery(".Legendoptions"), function(e){ updateDataView(e.name, false)});
        }
 				else
 				{
 					jQuery('input:checkbox.Legendoptions').prop('checked',true);
          jQuery.map(jQuery(".Legendoptions"), function(e){ updateDataView(e.name, true)});
        }
 			})
 		});
 	}


 	/*Public Methods, exposed because some people might be interested in these things*/
 	visualisation.prototype.getRelationships=function(){return relationships;};
 	visualisation.prototype.getExtendedNodes=function(){return root;};
 	visualisation.prototype.fetchNewGraphData=function(webserviceURL){fetchGraphData(webserviceURL); return this;};
 	visualisation.prototype.printMsg=function(msg){printMsgToScreen(msg);}

 	 /*If options are passed in, we extend (=override) the default options with the new options and start the network*/
   visualisation.prototype.visstart=function(DIVname, term, inputNetworkOptions, visoptions){
   var tmpstring="#".concat(DIVname.toString())
 	  mainDiv=jQuery(tmpstring);

 		//Apply the options for the network - mix them with the default options and save it in the global variable networkOptions
 		networkOptions=jQuery.extend( true, {},networkOptions,inputNetworkOptions);

 		//Mix the defaultVisNetworkOptions with the passed parameters visoptions
 		visNetworkOptions = jQuery.extend( true, {}, visNetworkOptions, visoptions);
 		startupvis(term);
 		return this;
 	}
}
