jQuery(function($){
	
	/*
	 * Class Constructor
	 * 
	 * Use of a closure allows each instance
	 * to have it's own ID. Closure is bound to the outer function
	 * context.
	 * @param	obj	DOM node reference (Form container)
	 * @returns	function	enclosed function to act as constructor
	 *
	 */
	var Validator = function(el,settings){
		var 
			ID = 0,
			w = window;
		
		var constructor = function(){
			ID++;
			this.ID = ID;
			
			this.defaults = {
				message:true,
				messageAction: 'gf_notifcation_message',
				emailValidationClass: 'email'
			}
			this.settings = $.extend(this.defaults,settings);
			
			this.ok = false;
			this.$el = $(el);
			this.inputs = [];
			this.events();
			return ID;
		}.bind(this);
		
		
		//We use this to access the prototype
		//of this instance (and thus all).
		//Refer to the diagram here for more info:
		//http://stackoverflow.com/questions/9959727/proto-vs-prototype-in-javascript
		if (!w.GFValidator){
			w.GFValidator = this.__proto__;
		}
		
		return constructor();
	};
	
	/*
	 * ===============================	
	 * Class Method declarations
	 *
	 */
	var V = Validator;
	
	/*
	 * Declare event handlers. Must be children of the
	 * form container
	 * @params	void
	 * @returns	void
	 *
	 */
	V.prototype.events = function(){
		this.$el
			.on('submit',this.validator.init.bind(this))
			.on('blur','input[type="text"]',this.autocheck.bind(this));
	}
	
	/*
	 * Called with every event trigger, whether it is
	 * on blur or on submit. Composes an array holding a reference
	 * to each DOM input element and it's reason for being validated
	 * @param	function	callback
	 * @returns	void
	 *
	 */
	V.prototype.gather = {
		iterate: function(cb){
			this.inputs = [];
			for (prop in this.gather){
				if (prop == 'iterate') continue;
				if (typeof this.gather[prop] == 'function'){
					this.gather[prop].call(this);
				}
			}
			cb();
		},
		
		/*
		 * Looks for required fields. Uses Gravity Form's default
		 * class to determine this
		 * @param	void
		 * @returns	void
		 *
		 */
		required: function(){
			var required = this.$el.find('.gfield_contains_required');
			for(i = 0; i < required.length; i++){
				var input = $(required[i]).find('input[type="text"]')[0];
				if (input) {
					this.inputs.push({
						why:'required',
						el:input
					})
				}
			}
		},
		
		/*
		 * Looks for email. Uses a user inputted class
		 * to determine this
		 * @param	void
		 * @returns	void
		 *
		 */
		email: function(){
			var 
				_class = this.settings['emailValidationClass'];
				email = this.$el.find('.gfield.'+_class);
			if (!email.length) return;
			for(i = 0; i < email.length; i++){
				var input = $(email[i]).find('input[type="text"]')[0];
				if (input) {
					this.inputs.push({
						why:_class,
						el:input
					})
				}
			}
		}
	}
	
	/*
	 * This method allows a user of the plugin
	 * to add a method to the validator after the 
	 * plugin has been instantiated by applying
	 * thi
	 * @param	string	class
	 * @param	function	method to apply
	 * @returns	void
	 *
	 */
	V.prototype.addMethod = function(string,method){
		if (typeof method != 'function') return false;
		if (typeof string != 'string') return false;
		var 
			gather = this['gather'],
			validator = this['validator'];
			
		gather[string] = function(){
			var $els = this.$el.find('li.gfield.'+string);
			for(i = 0; i < $els.length; i++){
				var input = $($els[i]).find('input[type="text"]')[0];
				if (input) {
					this.inputs.push({
						why:string,
						el:input
					})
				}
			}
		};
		
		//The method is called with the context bound to the
		//calling instance so no need to worry about it here	
		validator[string] = method;
	}
	
	/*
	 * Initializes Autocheck functionality (on input blur)
	 * only after the form has been submitted once
	 * @param	void
	 * @returns	void
	 *
	 */
	V.prototype.autocheck = function(){
		if (!this.submitted) return;
		this.validator.init.call(this);
	}
	
	/*
	 * You could think of this as the plugin engine.
	 * This 'init' method is called on form submit.
	 * It triggers the gathering of input data
	 * and sets the actual validating method as a callback
	 * @param	object	submit event object
	 * @returns	void
	 *
	 */
	V.prototype.validator = {
		init:function(e){
			this.validator.trigger = e ? 'submit' : 'blur';
			if (this.validator.trigger == 'submit'){
				this.submitted = true;
				if (this.ok) return true;
				e.preventDefault();
			}
			this.gather.iterate.call(this,this.validator.iterate.bind(this));
		},
		
		/*
		 * For all form inputs gathered, we use
		 * the 'why' property set in the gathering
		 * process to determine how to validate the input
		 * @param	void
		 * @returns	void
		 *
		 */
		iterate:function(){
			var errors = 0;
			for (i in this.inputs){
				var 
					curr = this.inputs[i],
					method = curr.why,
					el = curr.el;
				var res = this.validator[method].call(this,el);
				if (!res){
					errors++;
					curr.errors = true;
				} else {
					curr.errors = false;
				}
			}
			this.errors.iterate.call(this);
			if (errors){
				// Is this the first time there is errors?
				if (!this.enableAutocheck && this.settings.message) this.message.get.call(this);
				this.enableAutocheck = true;
			} else {
				if (this.validator.trigger == 'submit'){
					this.message.remove.call(this);
					this.ok = true;
					this.$el.addClass('submittable');
					this.submit();
				}
			}
		},
		
		/*
		 * The primary duty of this method it to access 
		 * if the input is empty. We have a switch 
		 * included incase a placeholder polyfill
		 * mucks with the node's value
		 * @param	object	reference to DOM node
		 * @returns	bool	whether or not the test passes
		 *
		 */
		required:function(el){
			var val = $(el).val();
			if (!val.length) return false;
			return true;
		},
		
		/*
		 * We use a regex to test if the email is valid
		 * @param	object	reference to DOM node
		 * @returns	bool	whether or not the test passes
		 *
		 */
		email:function(el){
			var 
				val = $(el).val();
				res = val.match(/^\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.]+[A-Za-z]{2,10}\b$/gi);
			if (res) return true;
			return false;
		}
	}
	
	/*
	 * This part is quite simple to follow, so I won't caption all methods.
	 * Adds/removes classes to the DOM
	 * @params	void
	 * @returns	void
	 *
	 */
	V.prototype.errors = {
		iterate:function(){
			for (i in this.inputs){
				var curr = this.inputs[i];
				if (curr.errors){
					this.errors.show(curr);
				} else {
					this.errors.hide(curr);
				}
			}
		},
		show: function(obj){
			$(obj.el).parents('.gfield').addClass('gfield_error');
		},
		hide:function(obj){
			$(obj.el).parents('.gfield').removeClass('gfield_error');
		},
	}
	
	/*
	 * Sends an Ajax call to the server with action supplied
	 * and upon reception of the message, displays it in the 
	 * DOM
	 * @params	void
	 * @returns	void
	 *
	 */
	V.prototype.message = {
		get:function(){
			var data = {
				location:''+document.location,
				action:this.settings['messageAction'],
				ajax:1
			}
			$.post(
				'/wp-admin/admin-ajax.php',
				data,
				this.message.render.bind(this),
				'json'
			)
		},
		render:function(data){
			if (this.$el.find('div.validation_error').length) return;
			var
				$message = $('<div class="validation_error hide">'),
			$header = this.$el.find('.gform_heading');
			$message.html(data).insertAfter($header);
			this.delay($message,'removeClass','hide',50);
			this.delay($message,'addClass','hide',4000);
			this.message.$el = $message;
		},
		remove:function(){
			if (this.message.$el){
				this.message.$el.remove();
				delete this.message.$el;
			}
		}
	}
	
	/*
	 * Wrapper for SetTimeout
	 * @param	obj	the object which the method belongs to
	 * @param function	the method to execute
	 * @param function	a parameter to feed to the method
	 * @param int	the amount to wait before the method is executed
	 * @returns	void
	 */
	V.prototype.delay = function(obj,method,param,delay){
		setTimeout(function(){
			obj[method](param);
		},delay);
	}
	
	/*
	 * Submits the form if this plugin decides
	 * that the form is going to pass backend
	 * validation
	 * @params	void
	 * @returns	void
	 */
	V.prototype.submit = function(){
		this.$el.submit();
	}
	
	/*
	 * ===============================	
	 * Turn this little class into a 
	 * simple jQuery plugin :)
	 *
	 */
	$.fn.GFValidator = function(settings){
		return this.each(function(index,el){
			el.validator = new Validator(el,settings);
		});
	};
	
	
	var settings = {
		message:true,
		messageAction: 'gf_notifcation_message',
		emailValidationClass: 'email'
	}
	
	$('form[id^="gform_"]').GFValidator(settings);
	
	/*
	 * Below is an example of how to 
	 * use the AddMethod function
	 *
	 */
	window.GFValidator.addMethod('test',function(el){
		var val = $(el).val();
		if (val !== 'testing') return false;
		return true;
	});	
	
});