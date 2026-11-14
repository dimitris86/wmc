WATERMARK VESSEL WEBSITE — NO SERVER REQUIRED

HOW TO OPEN
1. Extract the complete ZIP into a folder.
2. Double-click index.html.
3. The website works directly in your browser, without Python or internet.

FILES
index.html    Website page
style.css     Website styling
app.js        Search, filters, vessel dialog, gallery and navigation
database.js   The ONE editable vessel database (readable JavaScript data)
img/          All website images

EDITING THE DATABASE
Open database.js in a text editor. Each vessel is a JavaScript object,
with fields such as name, images, category, delivered and delivery_date.
After saving it, refresh index.html in the browser to see the change.

In each images array, use only the filename (for example, "photo.jpg"),
not "img/photo.jpg" or an absolute file path. Keep the images in img/.

There is no database.json to maintain or synchronize. The same database.js
works for direct file:// access and for a hosted site.
