# utils.py

from google.appengine.ext import ndb
import webapp2
import json
from google.net.proto.ProtocolBuffer import ProtocolBufferDecodeError 
# tests for invalid keys

def jsonDumps(dict):
# JSON.dumps returns a string representing a json object from an object
# used to format json dumps for speed and consistenly

    return json.dumps(dict, sort_keys=True, indent=2)

def getObj(id):
# excepts key
# returns empty obj if key is invalid

    obj = None
    try:
        obj = ndb.Key(urlsafe=id).get()
    except ProtocolBufferDecodeError:
        pass
    return obj
            
