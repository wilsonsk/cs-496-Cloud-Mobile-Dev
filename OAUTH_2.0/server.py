import os
import json
import jinja2
import webapp2
import urllib
import google.appengine.api.urlfetch as urlfetch

# Random state generator dependencies
import string
from random import *

# config jinja2 environment
JINJA_ENV = jinja2.Environment(
    loader = jinja2.FileSystemLoader(os.path.dirname(__file__) + "/templates")
)

# Google OAUTH2.0 API Client app's id, state (ie secret)
CLIENT_SECRET = "_n54-cCQxg2AjLJjV68mInIA"
CLIENT_ID = "505248232602-593ge8k5au4vleot8g1l11bs6k9iq5tm.apps.googleusercontent.com"

# Apps main URL
APP_URL = "https://oauth-183523.appspot.com"

# URL where End User is redirected after obtaining authorization code and the original client state (secret) 
END_USER_REDIRECT_URL = APP_URL + "/oauth"

# URL where Client sends authorization code and state in exchange for token
GOOGLE_OAUTH_REQ_URL = "https://accounts.google.com/o/oauth2/v2/auth" 

# URL where the Client uses token to access End User's data
GOOGLE_PLUS_URL = "https://www.googleapis.com/plus/v1/people/me"

# OAUTH2.0 initial "Client" secret
init_secret = "SuperSecret9000"

# Randomly generated state variable to display
RAND_STATE = ""
def genState():
	min_char = 8
	max_char = 12
	allchar = string.ascii_letters + string.punctuation + string.digits
	global RAND_STATE
	RAND_STATE = "".join(choice(allchar) for x in range(randint(min_char, max_char)))

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

class MainHandler(webapp2.RequestHandler):
	def get(self):
		genState()
		global RAND_STATE
		# Build OAUTH GET request URL
		end_user_server_req = GOOGLE_OAUTH_REQ_URL + "?" + 'response_type=code&' + 'client_id=' + CLIENT_ID + "&" + 'redirect_uri=' + END_USER_REDIRECT_URL + "&" + 'scope=email&state=' + init_secret
		
		# Send this URL request string to the jinja2 template and insert value into a UI button's href field
		context = {
			"title": "CS 496 OAUTH2.0 Assignment",
			"end_user_request": end_user_server_req,
			"state": RAND_STATE
		}
		template = JINJA_ENV.get_template('index.html')
		self.response.write(template.render(context))

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
class OauthHandler(webapp2.RequestHandler):
	def get(self):
		# Extract state and authorization code from "End User"
		req_state = self.request.get('state')
		req_auth_code = self.request.get('code')
		# verify state
		if req_state != init_secret:
			context = {
				"error": "Initial state does not match the End User's (browser's) state property"
			}
			template = JINJA_ENV.get_template('500.html')
			self.response.write(template.render(context))
			return
		
		# Build OAUTH2.0 token request header and body params
		header = {
			"Content-Type": "application/x-www-form-urlencoded"
		}

		body = {
			"code": req_auth_code,
			"client_id": CLIENT_ID,
			"client_secret": CLIENT_SECRET,
			"redirect_uri": END_USER_REDIRECT_URL,
			"grant_type": "authorization_code"
		}

		# URL encode body params
		url_encoded_body = urllib.urlencode(body)

		# Make POST request to OAUTH2.0 to obtain token
		res = urlfetch.fetch("https://www.googleapis.com/oauth2/v4/token/", headers=header, payload=url_encoded_body, method=urlfetch.POST)
		
		# Convert token string into JSON object - res.content contains the object that has the token properties
		token = json.loads(res.content)
		
		# Build Google Plus request header, and body params -- requires https
		header = {
			"Authorization": "Bearer " + token["access_token"]
		}

		res = urlfetch.fetch(GOOGLE_PLUS_URL, headers=header)
		
		# Convert Google Plus response into JSON object - res.content contains the object that has the Google Plus Resricted Properties
		url_encoded_gplus_res_data = json.loads(res.content)
		
		template = JINJA_ENV.get_template('gplus_results.html')

		# Retrieve global randomly generated state string
		global RAND_STATE

		# Extract Google Plus Restricted Properties from url encoded response data from GPlus and add to template for display 
		context = {
			'user_name': url_encoded_gplus_res_data['displayName'],
			'email': url_encoded_gplus_res_data['emails'][0]['value'],
			'state': RAND_STATE
		}

		# write response
		self.response.write(template.render(context))

#
# NotFoundHandler()
#
#
class ErrorHandler(webapp2.RequestHandler):
	def get(self):
		context = {
			"title": "Page Not Found",
			"error": "500 Resource Not Found"	
		}
		template = JINJA_ENV.get_template("500.html")
		self.response.write(template.render(context))

# OPTIONAL PATCH METHOD ENABLER
allowed_methods = webapp2.WSGIApplication.allowed_methods
new_allowed_methods = allowed_methods.union(('PATCH',))
webapp2.WSGIApplication.allowed_methods = new_allowed_methods

# Set http routes.
app = webapp2.WSGIApplication([('/', MainHandler),
                               ('/oauth', OauthHandler),
                               ('/.*', ErrorHandler)],
                              debug=True)
