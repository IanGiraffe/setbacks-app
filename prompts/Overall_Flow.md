here is the annotated dir: `src\README.md`  
here is a link to the SDK docs: `https://gi-docs.web.app/index.html`

Keep the code modular, stick to best software development practices: SOLID, KISS, YAGL

Here is the ultimate overall flow to this app and how it should be split into modules for each task

1. Get zoning inputs
    - either from user or an api (or both, unsure)
    - inputs: zoning data
    - outputs: a stored set of zoning data
2. Create a geometry in giraffe from the project boundary using the giraffe sdk
    - inputs: project boundary
    - outputs: giraffe geometry (polygon or multi-polygon) representing the boundary
3. Stores the zoning data inputs (from step 1) in the geometry as properties, creates a building envelope using the "envelope" flow within giraffe. 
    - inputs: zoning data
    - outputs: 3D building envelope
4. Design validation: If the user's design within giraffe breaches any of the zoning inputs (ie over max height), the app notifies the user. This will contain many different sub tasks that validate each parameter. 
    - Validate height: compares giraffe measures to app inputs
        - Inputs: "max provided height (ft)", "max provided height (stories)" measures from giraffe analytics,"MAX HEIGHT (ft)","MAX HEIGHT (stories)" 
        - Outputs: Boolean, true if the giraffe hwight is less than or equal to app height
    - Validate setback encroachment within Giraffe (do not program in app):
        - see if any building sections are encroaching on setbacks by seeing if the geom intersects the inner-most envelope polygon geom. This would actually be easier to do in a flow within giraffe, lets not code this. 
    - Validate FAR:compares giraffe measures to app inputs
        - Inputs: "Provided FAR" measure in giraffe, "MAX FAR" value from app
    - Validate Density:compares giraffe measures to app inputs
        - Inputs: "Provided Density" measure in giraffe, "MAX Density" value from app


If something is not compliant with the parameters, there should be a message in red saying which of the parameters is breaching. 

