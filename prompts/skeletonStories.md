The _skeletonStoriesLngLat Array
The _skeletonStoriesLngLat array is central to defining the buildable volume. Each element in the array is an object that represents a level of the building envelope, capturing how the footprint changes with height due to setbacks.
Structure of a Story Object
Each object within the _skeletonStoriesLngLat array contains the following key properties:
story (Object): Contains the parameters for that level, including:
height: The maximum height for this segment of the envelope.
rear, side, front: The setback distances applied at this level. A value of 0 indicates no setback is applied.
polygons (Array): This array contains the geometric representation of the buildable footprint for that specific story, with the setbacks from the story object already applied. The coordinates are in [longitude, latitude] format.
Identifying the Inner Polygon
The "inner polygon" is the final, most constrained buildable footprint after all setbacks have been applied. This typically corresponds to the story with the largest setback values.
In the provided example, the _skeletonStoriesLngLat array has three elements:
Index [0]: Represents the ground level with 0 setbacks. Its polygon is identical to the main geometry.coordinates property line.
Index [1]: Represents a level where setbacks (rear: 3.048, side: 1.524, front: 7.62) are first introduced.
Index [2]: Represents the final height of the envelope (12.192) and maintains the full setbacks. This story's polygon is the inner buildable area.
How to Access the Inner Polygon
To programmatically access the coordinates of the inner polygon, you can use the following path. This path targets the polygon associated with the story that includes the final setbacks.
Direct Access Path:
code
Code
_skeletonStoriesLngLat[2].polygons[0]
Path Breakdown:
_skeletonStoriesLngLat: Start by accessing the array containing the story-by-story envelope definitions.
[2]: Select the desired story object from the array by its index. To find the most constrained inner polygon, you would typically select the last object in this array, as it represents the final form of the envelope at its maximum height.
.polygons: Access the polygons property within that story object.
[0]: Access the first element of the polygons array, which is an array of coordinate pairs [longitude, latitude] that defines the vertices of the inner polygon.
Example (JavaScript):
code
JavaScript
// Assuming 'envelopeGeoJson' is the variable holding your JSON object

const innerPolygonCoordinates = envelopeGeoJson._skeletonStoriesLngLat[2].polygons[0];

console.log("Coordinates for the inner polygon:", innerPolygonCoordinates);

// This 'innerPolygonCoordinates' array can now be used to check for encroachments.