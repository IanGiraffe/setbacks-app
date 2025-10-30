here is the annotated dir: `src\README.md`
Keep the code modular, stick to best software development practices: SOLID, KISS, YAGL


Here is the URL to the SDK and documentation for Giraffe (https://gi-docs.web.app/index.html), an online GIS (Mapbox) based modeling platform for real estate massing and feasibility. This SDK allows users to create "iframe" applications that can talk with the Giraffe platform. We want to create a React app using Vite:

GOAL:
I want to create an application that take the current project boundary, creates a building envelope from that boundary, and allows the user to adjust the setbacks and height for that envelope. The user will have the ability to adjust the zoning parameters, and as they draw a site plan on the map, the application tracks the drawing to see if it complies with the zoning info. For example, if the "Max Height" is 50' and the user draws a building that is higher, the app will notify them that they are busted on height. Same with setbacks etc. 

The plan:

