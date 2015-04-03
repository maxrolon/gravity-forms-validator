# Gravity Forms Validator
Javascript validation for an enhanced Gravity Forms experience.

This is a very simple jQuery plugin designed to sit on top of the functionality that [Gravity Forms](http://www.gravityforms.com/) provides as a Wordpress Plugin. To aims to provide the user with instant form field validity feedback so that form/s don't have to send a request to the server to determine if form data has been inputted correctly. Rather than integrating directly with Gravity Forms, this plugin can be dropped in and is auto-instantiated based on Gravity Forms form container class naming conventions. 

### Why?
I've worked on a number of Wordpress sites that use Gravity Forms to handle form functionality requirements. Whilst the functionality that Gravity Forms provides is great, we get complaints about the user experience behind the forms; form data can disappear and needs to re-inputted if the form is submitted with invalid data; if the form sits on a long webpage the user will be scrolled to the top upon invalid submission.

### This plugin is basic
At this stage in handles text inputs. It may be enhanced to include other inputs as necessary.

### It can handle multiple forms on one page
Via it's nature as a jQuery plugin, multiple instantiations of the plugin will not cause conflicts with one another. 

### Instantiate the plugin
This code can be found at the bottom of the plugin javascript file. These lines actually activate the plugin and attach it to the Gravity Form/s on the page. Basic settings are provided. Open to configuration suggestions!

```javascript
var settings = {
	message:true, //Do you want to show a validation message to the user?
	messageAction: 'gf_notifcation_message', //If message=true, this is the name of the Wordpress action to handle the AJAX request
	emailValidationClass: 'email' //The class name to attach to a Gravity Forms form field to trigger email validation
}
	
$('form[id^="gform_"]').GFValidator(settings);
```
### Showing a message to the user
If you'd like to show a error message to the user, the plugin can get that message text via AJAX. In order to do this, see the PHP code example below (the ```messageAction``` setting is set to ```gf_notifcation_message```). This code can be placed in a Wordpress theme's functions.php file. Note: Requiring the message this way allows you to retrieve the message from the database. Handy if you use a tool like [ACF](http://www.advancedcustomfields.com/).
```php
add_action('wp_ajax_nopriv_gf_notifcation_message', 'gf_validation_method', 5);
add_action('wp_ajax_gf_notifcation_message', 'gf_validation_method', 5);

function localize_gf_validation_method($validation_message=false,$form=false){
	$is_ajax = (isset($_POST['ajax']) && (string) $_POST['ajax'] == '1');
	$message = 'This is your message';
	echo json_encode($message);
	exit;
}

```

### You can add your own method easily
Once the plugin has been instantiated, you can add your own validation methods to it. You do this through interacting with the window object as documented below:

```javascript
window.GFValidator.addMethod('test',function(el){
	var val = $(el).val();
	if (val !== 'testing') return false;
	return true;
});
```
In the example below, any Gravity Forms field with class 'test' attached to it, will be passed to the callback validation closure. The closure will need to return true for the input's value to be deemed as valid. Note: Purposefully, any methods added this way will be attached to the plugin object's prototype and thus will be accessible by all instances of the plugin (if there are two forms on the page, both will be able to use this validation method simultaneously).
