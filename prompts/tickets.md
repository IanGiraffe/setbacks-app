For context, once the envelope is dropped on the giraffe map, you can select any side of the property, and change it from a "front" to a "side" so that the envelope knows which setback to apply to it. 

For example, if i change a "side" to a "rear", it updates the geojson from this:
```
...
"parameters": {
                "version": "beta",
                "maxHeight": 12.192000390144,
                "sideIndices": {
                  "rear": [
                    2
                  ],
                  "side": [
                    1
                  ],
                  "front": [
                    0,
                    3
                  ]
                },
                "setbackSteps": {
                  "rear": [
                    {
                      "inset": 3.048000097536,
                      "height": 0
                    },
                    {
                      "inset": 3.048000097536
                    }
                  ],
                  "side": [
                    {
                      "inset": 1.524000048768,
                      "height": 0
                    },
                    {
                      "inset": 1.524000048768
                    }
                  ],
                  "front": [
                    {
                      "inset": 7.62000024384,
                      "height": 0
                    },
                    {
                      "inset": 7.62000024384
                    }
                  ]
                },
                "hasSetbackOutput": false
              },
              "type": "envelope"
...
```
to 

```
...
"parameters": {
          "version": "beta",
          "maxHeight": 12.192000390144,
          "sideIndices": {
            "rear": [
              2,
              1
            ],
            "side": [],
            "front": [
              0,
              3
            ]
          },
          "setbackSteps": {
            "rear": [
              {
                "inset": 3.048000097536,
                "height": 0
              },
              {
                "inset": 3.048000097536
              }
            ],
            "side": [
              {
                "inset": 1.524000048768,
                "height": 0
              },
              {
                "inset": 1.524000048768
              }
            ],
            "front": [
              {
                "inset": 7.62000024384,
                "height": 0
              },
              {
                "inset": 7.62000024384
              }
            ]
          },
          "hasSetbackOutput": false
        },
        "type": "envelope"

...
```

note that in the "sideIndices" property, the rear added data, and the side is an empty array. 

I want these properties to stay populate as they are, so that i dont have to change a side to a rear every time i update the envelope