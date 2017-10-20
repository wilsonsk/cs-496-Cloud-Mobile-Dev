import os
import json
import jinja2
import webapp2
import urllib
import google.appengine.api.urlfetch as urlfetch

# config jinja2 environment
JINJA_ENV = jinja2.Environment(
    loader = jinja2.FileSystemLoader(os.path.dirname(__file__) + "/templates")
)

# Client app's id, state (ie secret)
CLIENT_SECRET = "505248232602-593ge8k5au4vleot8g1l11bs6k9iq5tm.apps.googleusercontent.com"
CLIENT_ID = "_n54-cCQxg2AjLJjV68mInIA"

# Apps main URL
APP_URL = "https://oauth-183523.appspot.com"

# URL where End User is redirected after obtaining authorization code and the original client state (secret) 
END_USER_REDIRECT_URL = APP_URL + "/oauth"

# URL where Client sends authorization code and state in exchange for token
GOOGLE_OAUTH_REQ_URL = "https://accounts.google.com/o/oauth2/v2/auth" 

# URL where the Client uses token to access End User's data
GOOGLE_PLUS_URL = "https://www.googleapis.com/plus/v1/people/me"

#
# ROUTE HANDLERS
# 		- MainHandler()
#		- OauthHandler()
#

# Main Handler
#		- "Client" (web app)  creates the login URL based on id (CLIENT_ID), state(SuperSecret9000), scope (email) and the redirect (END_USER_REDIRECT_URL)
#			- Send created URL to jinja2 template to be used via OAUTH button press by "End User"
#		- Sends UI for "End User" to explicitly request the client to attempt to access a protected resource of the "End User"
#			- Upon activation, the "Client" will send the "End User" (browser) to the "Server" (Google OAUTH) 
#				- "End User" has list of requested permissions (scope, and in this case the scope is email of GPlus account) and a secret phrase
#					- both provided by the "Client" 
#				- authorization code

class MainHandler():
	def get(self):
		# Build OAUTH GET request URL
		end_user_server_req = GOOGLE_OAUTH_REQ_URL + "?" + \
			+ 'response_type=code&' + \ 
			+ 'client_id=' + CLIENT_ID + "&" + \
			+ 'redirect_uri=' + END_USER_REDIRECT_URL + "&" + \
			+ 'scope=email&' + \
			+ 'state=SuperSecret9000'
		
		# Send this URL request string to the jinja2 template and insert value into a UI button's href field
		context = {
			"title": "CS 496 OAUTH2.0 Assignment",
			"end_user_request": end_user_server_req 
		}
		template = JINJA_ENV().get_template('index.html')
		self.response.out.write(template(context))

# OAUTH Handler
# 		- "Client" handles the redirected "End User" coming from the Google OAUTH2.0 
# 			- "End User" redirect request now has the authorization code and the secret from the server
#		- "Client" verifies the secret from the "End User"
#			- "Client" initializes request body variables specific for attempting to obtain a OAUTH2.0 token
#				- 'code': authorization code	""" from 'End User' """
#				- 'client_id': CLIENT_ID	
#				- 'client_secret': CLIENT_SECRET
#				- 'grant_type': 'authorization_code'
#				- 'redirect_uri': END_USER_REDIRECT_URL
#			- "Client" url encodes the object containing the above request body variables	
#				- urllib.urlencode(bodyObj)
#			- "Client" sends POST request with appropriate headers, body (payload), and POST method to Google OAUTH2.0
#				- Attempting to get an OAUTH2.0 token
#			- "Client" converts token string into JSON object
#				- token = json.loads(result)
#			- "Client" makes GET request to Google Plus
#				- uses token (as header value) to get access to "End User" protected resources
#					- 'Authoriation': 'Bearer ' + token['access_token']
#			- "Client" uses jinja2 template to display out the protected resources


# OPTIONAL PATCH METHOD ENABLER
allowed_methods = webapp2.WSGIApplication.allowed_methods
new_allowed_methods = allowed_methods.union(('PATCH',))
webapp2.WSGIApplication.allowed_methods = new_allowed_methods

# Set http routes.
app = webapp2.WSGIApplication([('/', MainHandler),
                               ('/about-me', AboutHandler),
                               ('/oauth', OauthHandler),
                               ('/.*', NotFoundHandler)],
                              debug=True)
