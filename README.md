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

For detailed analysis see: doc/analysis.txt

## Main Features

Introductory Page with simple examples
Flow Diagram Page
Split Window Option
JSON Import Dataflow Chart Data

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

The flow lines between nodes are draughted automatically.

### Data Model

#### Tables
- flow_model
- page_flow_model_link
- page
- author
- external_author
- external_author_page_link
- reference
- external_author_reference_link
- node
- node_flow_link
- flow
- flow_point
- flow_arrow_point
- conversion_formula
- user
- user_page_link
- editor_key


#### flow_models
The highest level of abstraction is the flow diagram (FlowModel). 
Note that the flow model is defined by the first page entry of the model,
which has a hierarchicalId of "01"

The details are as follows:

- id - Auto Unique Long Int

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
- password - Password
- status - Char 16 - "owner"/"editor"/"user"

#### editor_key
- key - VarChar(255)

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

The following definition is known as the "JSON Hierarchical Flow Page 
Definition Version 1.3"

Clarifications:

- The top level (page) of a flow model has two, three or four nodes and all subsequent
pages are further definitions of the component nodes that they describe.
- The hierarchical_id of the top-level page is "01" and its details apply to the whole model
as well as the page that they describe
- All definitions (nodes / pages) should confine themselves to the constraint of the parent.
- Pages inherit the flows from their parent node (whether source or destination), ideally they should
be re-presented in the page
- it is permitted to branch a flow and a component from a component (as in motion from petrol flow, for example)
- A page should not consist of more than 8 component nodes
- A node number (NodeNum) is unique to a page only and consists of two digits, ie: "01".
- A hierarchical_id is built from its parent node numbers in order of descent, ie: "010204".
- When using keywords, beware of terms such as "flow" which are likely to be too common to be useful

```js
flow_models: [
	{
		"id": , // Auto Long Int
		"pages" : [
			{
		 		"hierarchical_id": "", // ie: 01020406 for a level four page. Note that the numbers (apart from the first)
					// are NodeNums, the first/top level is always "01"
				"title": "",
				"keywords": "",
				"authors": [""], // Username or Author
				"references": [
					{
						"source": "", // ie: "Web Page" or Publisher
						"title:",
						"author:"
					},
					..
				], // The sources of the information, ie: book, paper titles

				"nodes": [
					{
						"node_num" : "", // (ie: "01")
						"label": "",
						"type": "", // (Mechanism/Effect)
						"definition": "", // optional
						"keywords": "", // optional
						"hyperlink":, "", // optional a hypertext link to further information
						"has_child_page": // true/false
					},
					..
				],

				"flows" : [
					{
						"source_node_num": "", 
						"destination_node_num": "", // (optional)
						"label": "",
						"keywords": "", // (optional)
						"definition": "", // (optional)
						"conversion_formulas": [
							{
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
	},
	..
]
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

## Schedule

Project Start: 01/04/2024

| Item                         | Est Days | Actual Days |
| ---------------------------- | -------- | ----------- |
| Planning and Analysis        | 30       |             |
| Learn React Flow             | 5        | 5           |
| Learn Vanilla PixiJS         | 3        |             |
| Graphics                     | 2        |             |
| Code Intro Page HTML         | 3        |             |
| Code DataFlow Page HTML      | 5        |             |
| Code DataFlow Page JS        | 20       |             |
| Code MYSQL set-up            | 2        |             |
| Code PHP/MYSQL               | 6        |             |
| Flow Model Examples          | 5        |             |
| Systems Test Plan            | 3        |             |
| Systems Test                 | 6        |             |
| ---------------------------- | -------- | ----------- |
| Totals                       | 70       |             |
| ---------------------------- | -------- | ----------- |
| Phase II Investigation       | 5        |             |
