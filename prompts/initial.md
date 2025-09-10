Giraffe App Building Prompt

Here is the URL to the SDK and documentation for Giraffe (https://gi-docs.web.app/index.html), an online GIS (Mapbox) based modeling platform for real estate massing and feasibility. This SDK allows users to create "iframe" applications that can talk with the Giraffe platform. We want to create a React app using Vite that:

I want to create an application that take the current project boundary, creates a building envelope from that boundary, and allows the user to adjust the setbacks and height for that envelope. 

The current data I have is:
The geojson structure of the building envelope flow
```
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "usage": "Envelope",
        "id": "fkZukW7EJefH4ESgArVCq",
        "flow": {
          "id": "9ed6808627da407ca40b2f5fab01e326",
          "inputs": {
            "62f9968fb7ab458698ecc6b32cc20fef": {
              "type": "envelope",
              "parameters": {
                "version": "beta",
                "maxHeight": 20,
                "sideIndices": {
                  "rear": [],
                  "side": [
                    0,
                    2
                  ],
                  "front": [
                    1
                  ]
                },
                "setbackSteps": {
                  "rear": [
                    {
                      "inset": 6,
                      "height": 0
                    },
                    {
                      "inset": 6
                    }
                  ],
                  "side": [
                    {
                      "inset": 3,
                      "height": 0
                    },
                    {
                      "inset": 3
                    }
                  ],
                  "front": [
                    {
                      "inset": 2,
                      "height": 0
                    },
                    {
                      "inset": 2
                    }
                  ]
                },
                "hasSetbackOutput": false
              }
            }
          }
        },
        "appId": "1",
        "color": "#7af3ff",
        "public": true,
        "stroke": "#257676",
        "projectId": "58700",
        "stackOrder": 0,
        "fillOpacity": 0.4282,
        "strokeOpacity": 1,
        "layerId": "app test"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -97.71084385,
              30.22834807
            ],
            [
              -97.71063766,
              30.22834534
            ],
            [
              -97.7106338,
              30.22856446
            ],
            [
              -97.71084,
              30.2285672
            ],
            [
              -97.71084385,
              30.22834807
            ]
          ]
        ]
      }
    }
  ]
}
```

Here is how to access the current project coordinates (geometry) along with an example:
"""
## `giraffeState` Data Structures

The following sections detail the data structures returned by `giraffeState.get(key)` for various keys.

### `project`

> `giraffeState.get('project')`

Retrieves a GeoJSON Feature object representing the currently active project boundary and its properties.

<details>
<summary>View 'project' JSON structure</summary>

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [/* an array of coordinate arrays */]
  },
  "properties": {
    "name": "Austin Feasibility",
    "id": "58808",
    "units": "meters",
    "org_id": 1,
    "org_name": "Giraffe Team",
    "created_at": "2025-07-25T16:19:49.225471+00:00",
    "updated_at": "2025-08-01T03:51:28.270885+00:00",
    /* ... more custom and system properties ... */
  },
  "_permissions": {
    "userAccess": [
      {
        "id": 115823,
        "user_email": "ian@giraffe.build",
        "project": 58808,
        "access_level": "admin"
      }
    ],
    "teamAccess": [],
    "orgAccess": [],
    "orgAdmin": true,
    "fullPermissions": false,
    "maxPermission": "admin"
  }
}
```
</details>
"""

The core features I want to include are:
1. Once a project boundary is defined, have a "generate building envelope" button appear.
2. The user will have the ability to populate the following fields, which will impact the shape of the building envelope:
  - Max Height
  - Front Setback
  - Side Setback
  - Rear Setback
  
3. Once "generate building envelope" is clicked, a building envelope is generated in the shape of the project boundary, honoring the user-specified setback distances. You can see all of these properties within the building envelope geojson already (setbacks and height). We just want to populate those properly by the user input. The envelope boundary should match that of the project boundary. 

I'm not familiar with this SDK nor am I a software developer so I'm leaning on you to find the functions we need. 
We need to stick to best practices, properly chunking the code into separation of concerns and maintaining modularity. I need to set this project up from scratch. Lets get going. 