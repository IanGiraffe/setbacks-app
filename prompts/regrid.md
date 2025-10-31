Here is the @ARCHITECTURE.md for context. We are going to use the regrid api to aid in fetching zoning data. This will function as a standalone module that is able to fetch the zoning ordinance website URL and the selected property's zoning district as input, and output the zoning regulations for that zoning district. The output will be structured in a way so that it is easy to access the fields and values as input in other apps, including this one. 

Here is the source token for regrid: 
    `https://tiles.regrid.com/api/v1/sources/parcel/layers/cd7da01c214eb04c81a9307dfde8fa60f01b3e4d/{z}/{x}/{y}.mvt?token=YDJDxjbQwo3cjGJZNxxS93b4UP89uphtBk5zi8rKXgWMFr-jM8SxrWBMLCn3yeJz`

Here is the regrid documentation: `https://support.regrid.com/api/section/parcel-api`

Here is the regrid Parcel Schema: `https://support.regrid.com/parcel-data/schema`

We are interested in the fields `zoning_code_link` and `zoning_type`. 
