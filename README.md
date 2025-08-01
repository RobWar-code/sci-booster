# Sci-Booster Learning Sciences and Systems

## Introduction

This website presents a methodology for examining and learning about 
systems in the natural world and in the world of technology. It can be 
used to gain a general overview of nature and of technology, or to 
provide a platform to study systems in greater detail.

It consists of two sections, firstly a presentation of the methodology
and some partially worked examples, to give the reader a chance to
understand the approach. Then a section that provides tools for making
the scheme easy to apply.

Because the system also provides import and export json features, a 
page is dedicated to describing the json format.

For detailed analysis see: doc/analysis.txt

## Sci-Booster Reinstatement

The main website was shut down for a few months (as at 24/07/2025).
The current project aim is to reinstate sci-booster on the local
Apache host, and to redeploy it on the Fasthosts server once that
is up and running.

## Screenshot of Flow Page

![Main Flow Page](doc/sci-booster-flow-page.png)

## Main Features

Introductory Page with simple examples
Flow Diagram Page
JSON Help Page
JSON Import/Export Dataflow Chart Data

## Flow Diagram Section

![Page Layout Diagram](./doc/FlowPage.svg)

The flow diagram section provides a scrollable alphabetical index of
diagrams which is also Keyword/Flow Model Title/Node Term/Flow Term 
searchable.

The title for the diagram is editable and appears at the top of the
diagram section.

The flow diagrams consist of node boxes joined by flow lines that
indicate the flow of some item between one entity and another,
for example:

Source ----->----- Storage/Processor ------>----- Receiver

The display area can be clicked to cause the node definition panel
and an empty node to appear.

Nodes can be clicked and dragged into position and flow lines can
be added to the edges of nodes.

The nodes each contain buttons used to provide a new flow or more 
details about the node.

The flow lines are simply drawn as linked lines by the user and arrows
and labels can be easily added to them.

### Data Model

#### Tables
- flow_model
- page_flow_model_link
- page
- author
- external_author
- external_author_page_link
- reference
- node
- node_flow_link
- flow
- flow_point
- flow_arrow_point
- conversion_formula
- user
- user_page_link
- temp_password
- editor_key


#### flow_models
The highest level of abstraction is the flow diagram (FlowModel). 
Note that the flow model is defined by the first page entry of the model,
which has a hierarchicalId of "01"

The details are as follows:

- id - Auto Unique Long Int
- title - char 64

Links
	page_flow_model_link


#### pages
The page data includes a hierarchical_id, the first page has the HierarchicalId
of "01", which represents the top level of the model hierarchy.

The flow diagrams consist of nodes connected by links that represent flows.
These are linked hierarchically so that zooming through a particular node
reveals further flows for that node. In this way each flow diagram is referred
to as a page. Pages should not contain more than nine nodes.
The page data is as follows:

- id - Auto Unique Long Int
- flow_model_id - Int
- hierarchical_id - Char 64, ie: 020406 for a level four page. Note that the numbers are NodeNums
- title - Char 64
- description - VarChar
- keywords - Char 256

Links
	node_link - Nodes
	flow_link - Flows
	references_page_link - References
	authors_page_link - Users
	external_authors_page_link - External Authors

#### nodes
A node is associated with the following:
- id - Auto Unique Long Int
- page_id - Char 64
- node_num - Char 2 ie: "01"
- label - Char 32
- graphic_file - Char 256
- graphic_text - Char 1024
- graphic_credits - Char 256
- x_coord - Short Int
- y_coord - Short Int
- type - Char 16 - "mechanism"/"effect"
- definition - VarChar - optional
- keywords - Char 256 - optional
- hyperlink - Char 256 - optional a hypertext link to further information
- has_child_page - Boolean

Links
	node_flow_link - Flows

#### flows
- id - Auto Unique Long Int
- page_id - Int
- flow_num - Char 2 Auto ie: "01"
- label - Char 32
- label_x - Int
- label_y - Int
- label_width - Int
- keywords - Char 256
- definition - VarChar (optional)
- hyperlink - Char 256(optional)
- source_void - boolean
- source_node_id - Int
- destination_void - boolean
- destination_node_id - Int (optional if not specified, consider motion of car)

Links
	conversion_formula - Conversion Formulas
	flow_point
	flow_arrow_point

#### flow_point
- id  - Auto Unique Int
- flow_id - Int
- x - Int
- y - Int

#### flow_arrow_point
- id - Auto Unique Int
- flow_id - int
- x - int
- y - int

#### user
- id - Auto Unique Long Int
- username - Char 64
- email - Char 128
- password - Password
- status - Char 16 - "owner"/"editor"/"user"

#### editor_key
- key - VarChar(255)

#### temp_password
- id - Auto Unique Long Int
- password - Char 12 

#### user_page_link
- id - Auto Unique Long Int
- user_id - Long Int
- page_id - Long Int

#### external_author
- id - Auto Unique Long Int
- first_name - Char 32 - firstname or initial
- last_name - Char 64

#### external_author_page_link
- id - Auto Unique Long Int
- external_author_Id - Long Int
- page_id - Long Int

#### reference
- id - Auto Unique Long Int
- source - Char 256
- title - Char 256

Links
	external_author_reference_link - Authors

#### author_references_link
- id - Auto Unique Long Int
- reference_id
- external_author_id

#### reference_page_link
- id - Auto Unique Long Int
- reference_id - Long Int
- page_id - Long Int

#### conversion_formula
- id - Auto Unique Long Int
- flow_id - Int
- formula - VarChar
- description - VarChar

### JSON Inputs / Outputs

This feature allows for the importation/exportation of data for other 
sources, notably ChatGPT, in which the data may be easily edited for
import.

The following definition is known as the "Sci-Booster Flow Model JSON
Definition Version 1.8"

The purpose of this section is to describe the required format of the flow-model 
JSON object for data imports to the app. This is provided for both AI's such as
ChatGPT and human contributors.

The import data may also have been obtained as an export from the app database,
in this case id fields will be set. Such exports can be edited.

JSON Models supplied as updates without id fields must preserve title, label and
hierarchical_id fields for the data items to be updated, although new items can be 
added in an update.

#### Descriptive Details
A flow model consists of pages of component nodes and flow lines used to describe
a flow system. The pages are defined as a heirarchy of descriptive detail for each
component node as required. For example, a top-level flow model might be:

Petrol Station ---flow:petrol--->------- Car --flow:exhaust-->---- Atmosphere

- Fictional/example data should not be used in the json fields, they should
  be left with "" or null values if not known
- The "complete" field must be included to indicate whether the
whole model is being described or only certain pages (true/false)
- The top level (page) of a flow model has upto four nodes and all subsequent
pages are further definitions of the component nodes that they describe.
- The flow_model_title should always be present at the top level and must the same
as for the first page of hierarchical_id "01"
- The "id" field of each field where shown below of the json model should be present and 
set to null unless it is known via the site database from a data export.
- The hierarchical_id of the top-level page is "01" and its details apply to the whole model
as well as the page that they describe
- All definitions (nodes / pages) should confine themselves to the constraint of the parent.
- Pages inherit the flows from their parent node (whether source or destination), ideally they should
be re-presented in the page
- It is permitted to have more than one flow from a component (as in motion and exhaust for a car
with a petrol flow input, for example)
- A page should not consist of more than 8 component nodes
- A node number (NodeNum) is unique to a page only and consists of two digits, ie: "01".
- The node "type" field should be "mechanism" or "effect". "mechanism" simply means physical unit,
"effect" is for output conditions such as "pollution" or "explosion"
- A hierarchical_id is built from its parent node numbers in order of descent, ie: "010204".
- When using keyword fields, beware of terms such as "flow" which are likely to be 
too common to be useful
- Flows are used to connect component nodes and their positions should be calculated as such

#### Visual Spatial Information for The Flow Diagram

The drawing area (stage) onto which a flow diagram page is drawn is 380 pixels wide by
690 pixels high.

##### Component Node Boxes

The stage area is sufficent for upto 8 component nodes, if arranged vertically in sets
of 4. So eight is the maximum number of component nodes for a page.

Component nodes are represented by rectangular boxes 140 pixels wide by 75 pixels high.

On the drawing, vertically arranged component node should be spaced 90 pixels between
the base of one node and the top of another (ie: node y coordinates are 165 pixels apart.

When there are more than 4 component nodes the node boxes should be offset from the left
margin edge of the stage by 5 pixels for left hand column and margin of 5 pixels on the
on the right, for the right hand column.

The position of the component node is given in node "x" and "y" fields, this is the top left
corner of the component node box.

##### Flow Representations

All flow coordinates are relative to the "drawing_group_x" and "drawing_group_y" 
coordinates, which typically set to the position of the flow line described below.

Flows are represented by sets of line segments whose coordinates are given in the flow
"points" field, each start/end points of the set of the line segments should be given.

Generally the flow lines connect a source component node box to a destination node box,
typically from the bottom of one box to the top of another.

The flow details include an "arrow_points" field for defining the coordinates of each of the 
4 nodes of an equilateral triangle, of which the bottom side is indented 
toward the apex by two pixels, that sits on the flow line and points toward the destination.
the triangle is about 10 pixels high.

The flow label appears in a box, who's top-left coordinates are given in the "label_x",
"label_y" fields.

The "label_width" field can be set to 60 by default, this is calculated from flow label text
anyway.

#### JSON Object Structure
```js
{
	"flow_model_id": , // Auto Long Int, may be null
	"flow_model_title": "", // Must the same as the first page with hierarchical_id of "01"
	"update": , // true/false whether this is an update
	"complete": , // true/false whether this is an update for a complete model, or only
			// a partial update (subset of pages)
	"pages" : [
		{
			"id": , // May be null
			"hierarchical_id": "", // ie: 01020406 for a level four page. Note that the numbers (apart from the first)
				// are NodeNums, the first/top level is always "01"
			"title": "",
			"keywords": "",
			"description": "",
			"user_authors": [
				{
					"id": , // May be null (id of the user)
					"username": ""
				}
			], // Authors who are users
			"external_authors": [
				{
					"id": , // May be null (id of the author)
					"author": ""
				}
			],
			"references": [
				{
					"id": , // may be null
					"source": "", // ie: "Web Page" or Publisher
					"title":,
					"author": {
						"id":, // May be null
						"author": "" 
					}
				},
				..
			], // The sources of the information, ie: book, paper titles

			"nodes": [
				{
					"id": , // May be null
					"node_num" : "", // (ie: "01")
					"x": , // Integer, the x coordinate of the component node box on the stage (0 to stage width)
					"y": , // Integer, the y coordinate of the component node box on the stage (0 to stage height)
					"label": "",
					"graphic_file": "", // File name/ web link of the image associated with the node
					"graphic_text": "",
					"graphic_credits": "",
					"type": "", // (Mechanism/Effect)
					"definition": "", // optional
					"keywords": "", // optional
					"hyperlink": "", // optional a hypertext link to further information
					"has_child_page": // true/false
				},
				..
			],

			"flows" : [
				{
					"id": , // May be null
					"flow_num": ""// Unique to the page two digits, ie: "03"
					"source_node_num": "", 
					"destination_node_num": "", // (optional)
					"label": "",
					"label_x": , // integer (range -stage width to stage width, relative to drawing_group_x)
					"label_y": , // integer (range -stage height to stage height. relative to drawing_group_y)
					"label_width": , // integer, optional to suit characters of the label that are size 13px
					"drawing_group_x": ,// integer (the base coordinate of the flow on the stage)
					"drawing_group_y": ,// integer (the base coordinate of the flow on the stage)
					"arrow_points": , // [{x: , y: }] optional, the coordinates of the nodes of the arrow that
									// sits on the flow line and points toward the destination
					"points": ,// [{x: , y: }] the flow line node points, relative to drawing_group x, y. 
								// (x: -stage width to stage width, y: -stage height to stage height)
					"keywords": "", // (optional)
					"definition": "", // (optional)
					"conversion_formulas": [
						{
							"id": , // May be null
							"formula": "",
							"description": ""
						},
						..
					]
					"hyperlink": "" // (optional) a link to further information
				},
				..
			]
			
		},
		..
	]
}
```
### Flow Diagram Tools/Feasibility

#### reactflow

5 man days were spent studying reactflow, but it was decided that this
wasn't sufficiently flexible/responsive to meet the requirements tidily,
basically because of the limitations of using React/JSX based code for
the diagram.

#### Phase II Investigation

In this phase it is decided to do the data model for the flow diagrams
first. Also to define the user-interface more precisely and then see
which coding approach might best be used.

Having experimented with PIXI in vanilla javascript mode, it was decided
to use the Konva canvas graphics library instead. The online documentation 
for this is particularly high-quality.

## Setup

Existing FastHosts database, within the narayana-art website.
PHP (latest version)
MySQL
Bootstrap in main HTML file
Konva Link in main HTML file


### Trail Set-up (abandoned)
- npx create-react-app sci-booster
- npm install react-bootstrap
- For react-bootstrap you should also include the element "Link rel=" in the 
public/index.html file. (see the documentation)
- npm install react-router-dom
- npm install reactflow

### Development Set-up
	Using Apache/MySql/PHP for a local host environment

## Schedule

Project Start: 01/04/2024

| Item                         | Est Days | Actual Days |
| ---------------------------- | -------- | ----------- |
| Planning and Analysis        | 30       | 15          |
| Learn React Flow             | 5        | 5           |
| Learn Vanilla PixiJS         | 3        | 1           |
| Learn Konva Graphics		   | 3        | 3           |
| Graphics                     | 2        | 2           |
| Code Intro Page HTML         | 3        | 1           |
| Import Help page             | 2        | 1           |
| Code DataFlow Page HTML      | 5        | 7           |
| Code DataFlow Page JS        | 20       | 55          |
| Code MYSQL set-up            | 2        | 5           |
| Code PHP/MYSQL               | 6        | 30          |
| Flow Model Examples          | 5        | 10          |
| Systems Test Plan            | 3        | 5           |
| Systems Test                 | 6        | 25          |
| Release                      |          | 1           |
| Release Test                 |          | 1           |
| ---------------------------- | -------- | ----------- |
| Totals                       | 75       |             |
| ---------------------------- | -------- | ----------- |
| Phase II Investigation       | 5        |             |

Notes:
The original PHP/MYSQL estimates did not include the import/export
code times.

### Project Planning Notes

It would have better to spend an extra 4 days of analysis
after one month of work, to redo the estimates, which were
rather a long way short.

## Critique

02/11/2024

Consider changing the way in which the chart is redrawn in
non-edit mode. It may be better to re-draw nodes, lines,
flow-arrows, flow-labels in that order for the whole
chart.

Consider having more than one hyperlink where they apply.

Allow for multiple authors in references

Increase the height of the modal description/definition
boxes by three lines.

It would have been better to write the PHP code in classes
one per file, with names matching the files and this ought
to be adopted as a standard. Likely it would be better to
do the CRUD actions on each table with a class of the same
name.