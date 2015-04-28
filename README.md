# responsive-editor [![Build Status](https://travis-ci.org/romantaraban/responsive-editor.svg)](https://travis-ci.org/romantaraban/responsive-editor)

WYSIWYG editor for responsive content

## Usage

To create instance of editor on your page 

```
<!-- include script on your page -->
<script src="editor.js"></script>

<script>
  // create new instance of editor
  var parentElement = document.getElementById('editorHolder');
  var content = null;
  var options = {
      cssPath: './editor.css',
      useIframe: false  
  };
  var editor = new ResponsiveEditor(parentElement, content, options);
</script>
```
## API

There are several methods to work with content

### editor.serialize(toJSON)
Serialize editor state to JSON object or string.

### editor.buildFromSerialized(data)
Use serialzed data to build editor content

### editor.renderHTML()
Render editor's state to html, return html string

### editor.renderTo(target)
Render editor's state to html, and place it inside target element


MIT &copy Roman Taraban
