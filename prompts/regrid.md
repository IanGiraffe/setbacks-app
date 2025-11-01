Here is the @ARCHITECTURE.md for context. We are going to use the regrid api to aid in fetching zoning data. This will function as a standalone module that is able to fetch the zoning ordinance website URL and the selected property's zoning district as input, and output the zoning regulations for that zoning district. The output will be structured in a way so that it is easy to access the fields and values as input in other apps, including this one. 

Here is the source token for regrid: 
    `https://tiles.regrid.com/api/v1/sources/parcel/layers/cd7da01c214eb04c81a9307dfde8fa60f01b3e4d/{z}/{x}/{y}.mvt?token=YDJDxjbQwo3cjGJZNxxS93b4UP89uphtBk5zi8rKXgWMFr-jM8SxrWBMLCn3yeJz`

Here is the regrid documentation: `https://support.regrid.com/api/section/parcel-api`

Here is the regrid Parcel Schema: `https://support.regrid.com/parcel-data/schema`

We are interested in the fields `zoning_code_link` and `zoning_type`. 


Please review all relevant code/docs and put together an implementation plan. Write this implementation plan down in an .md file with a checklist and then we can start checking items off the list. 

The implementation plan should clearly state the goal, inputs outputs and where we are in the process. 

Giraffe is a mapbox-based platform, so I'd say we identify the parcel(s) by using the boundary geometry. In this current app, we have the boundary geometry stored in [envelopeFactory.js](src/utils/envelopeFactory.js)  (or at least trace it down from there). We can import this into the module as cleanly to keep the module as standalone as possible. 

Because zoning code varies so widely, we should come up with a standard template of dimensional regs to fill out (Setbacks, Impervious Cover, Building Cover, FAR, Density, use compatibility buffers, min lot size, frontage, etc). 

We will then call an llm to act as an agent and parse the code, as well as use tools to structure the dimensional regs into the template. We will use claudes API for this. We will use Agent Skills with the API to train claude on what to look for and typical examples: `https://docs.claude.com/en/api/skills-guide`

