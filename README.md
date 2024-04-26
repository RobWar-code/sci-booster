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
**Update this
- FlowModels
- Pages
- Nodes
- Flows
- Users
- References
- Users
- UserLink
- ReferencesLink
- Formulas
- FormulaFlowLink
- ExternalAuthors
- ExternalAuthorsLink

#### FlowModels
The highest level of abstraction is the flow diagram (FlowModel) and its association
with an author. The details are as follows
- id - Auto Unique Long Int
- Title - Char 64
- Description - VarChar
- Keywords - Char 256
- Last Updated - Date

Links
	AuthorsFlowModelLink - Authors
	ExternalAuthorsFlowModelLink - Authors

#### Pages
The flow diagrams consist of nodes connected by links that represent flows.
These are linked hierarchically so that zooming through a particular node
reveals further flows for that node. In this way each flow diagram is referred
to as a page. Pages should not contain more than nine nodes.
The page data is as follows:

- id - Auto Unique Long Int
- HierarchicalId - Char 64, ie: 020406 for a level four page. Note that the numbers are NodeNums
- Title - Char 64
- Keywords - Char 256

Links
	NodeLink - Nodes
	FlowLink - Flows
	ReferencesFlowModelLink - References
	AuthorsLink - Users
	ExternalAuthorsLink - External Authors

#### Nodes
A node is associated with the following:
- id - Auto Unique Long Int
- PageId - Char 64
- NodeNum - Char 2 ie: "01"
- XCoord - Short Int
- YCoord - Short Int
- Label - Char 32
- Type (Mechanism/Effect) - Char 16
- Definition - VarChar - optional
- Keywords - Char 256 - optional
- Hyperlink - Char 256 - optional a hypertext link to further information
- HasChildPage - Boolean

Links
	NodeFlowLink - Flows

#### Flows
- id - Auto Unique Long Int
- SourceX - ShortInt
- SourceY - ShortInt
- DestinationX - Short Int
- DestinationY - Short Int
- SourceNodeId - Int
- DestinationNodeId - Int (optional if not specified, consider motion of car)
- Label - Char 32
- Keywords - Char 256
- Definition - VarChar (optional)
- Hyperlink - Char 256(optional)

Links
	ConversionFormulasFlowLink - Conversion Formulas

#### NodeFlowLink
- id - Auto Unique Long Int
- FlowId - Long Int
- NodeId - Long Int

#### Users
- id - Auto Unique Long Int
- UserName - Char 64
- Password - Password
- Status - Char 16 - "Editor"/"User"

#### Authors
- id - Auto Unique Long Int
- UserId - Long Int
- FlowModelId - Long Int

#### ExternalAuthors
- id - Auto Unique Long Int
- FirstName/Initial - Char 32
- LastName - Char 64

#### ExternalAuthorsFlowModelLink
- id - Auto Unique Long Int
- ExternalAuthorsId - Long Int
- FlowModelId - Long Int

#### ExternalAuthorsPageLink
- id - Auto Unique Long Int
- ExternalAuthorsId - Long Int
- FlowModelId - Long Int

#### References
- id - Auto Unique Long Int
- Source - Char 256
- Title - Char 256
- Hyperlink - Char 256

Links
	AuthorsReferencesLink - Authors

#### ReferencesPageLink
- id - Auto Unique Long Int
- ReferenceId - Long Int
- PageId - Long Int

#### ReferencesFlowModelLink
- id - Auto Unique Long Int
- ReferenceId - Long Int
- FlowModelId - Long Int

#### ConversionFormulas
- id - Auto Unique Long Int
- Formula - VarChar
- Description - VarChar

#### ConversionFormulasFlowLink
- id
- ConversionFormulaId
- FlowId


### JSON Inputs / Outputs

This feature allows for the importation/exportation of data for other 
sources, notably ChatGPT, in which the data may be easily edited for
import.

The following definition is known as the "JSON Hierarchical Flow Page 
Definition Version 1.1"

Clarifications:

- The top level (Page) of a flow model has two, three or four Nodes and all subsequent
pages are further definitions of the component that they describe.
- All definitions (nodes / pages) should confine themselves to the constraint of the parent.
- Pages inherit the flows from their parent node (whether source or destination), ideally they should
be re-presented in the page
- It is permitted to branch a flow and a component from a component (as in motion from petrol flow, for example)
- A page should not consist of more than 8 components/nodes
- A node number (NodeNum) is unique to a page only and consists of two digits, ie: "01".
- A HierarchicalID is built from its parent node numbers in order of descent, ie: "010204".
- When using Keywords, beware of terms such as "flow" which are likely to be to common to be useful

```js
FlowModels: [
	{
		"Title": "",
		"Description": "",
		"Keywords": "",
		"Authors": ["UserName1/Author Name", ..], // If the author is not a user, see ExternalAuthors"
		"References:": [
			{
				"Source": "", // ie: "Web Page" or Publisher
				"Title": "",
				"Author: ""
			},
			..
		]
		"LastUpdated": "",
		"NumPages": "", // Total Number of pages in the flow model

		"Pages" : [
			{
		 		"HierarchicalId": "", // ie: 020406 for a level four page. Note that the numbers (apart from the first)
					// are NodeNums
				"Title": "",
				"Keywords": "",
				"References": [
					{
						"Source": "", // ie: "Web Page" or Publisher
						"Title:",
						"Author:"
					},
					..
				], // The sources of the information, ie: book, paper titles

				"Nodes": [
					{
						"NodeNum" : "", // (ie: "01")
						"Label": "",
						"Type": "", // (Mechanism/Effect)
						"Definition": "", // optional
						"Keywords": "", // optional
						"Hyperlink":, "", // optional a hypertext link to further information
						"HasChildPage": // true/false
					},
					..
				],

				"Flows" : [
					{
						"SourceNodeNum": "", 
						"DestinationNodeNum": "", // (optional)
						"Label": "",
						"Keywords": "", // (optional)
						"Definition": "", // (optional)
						"ConversionFormulas": [
							{
								"Formula": "",
								"Description": ""
							},
							..
						]
						"Hyperlink": "" // (optional) a link to further information
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
