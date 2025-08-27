"""
Mock dashscope module to bypass the import error
This allows generate.py to run without the actual dashscope API
"""

import json
from http import HTTPStatus

# Mock API settings
api_key = "dummy_key_for_bypass"
base_http_api_url = "https://dashscope.aliyuncs.com/api/v1"

class MockResponse:
    def __init__(self):
        self.status_code = HTTPStatus.OK
    
    def __getitem__(self, key):
        if key == 'output':
            return {
                'choices': [{
                    'message': {
                        'content': 'Generated prompt content'
                    }
                }]
            }
        return {}

class Generation:
    @staticmethod
    def call(model, messages=None, seed=None, result_format=None, **kwargs):
        """Mock API call that returns a dummy response"""
        return MockResponse()

class MultiModalConversation:
    @staticmethod
    def call(model, messages=None, seed=None, result_format=None, **kwargs):
        """Mock API call for multimodal content"""
        return MockResponse()

# HTTPStatus for compatibility
def __getattr__(name):
    if name == 'HTTPStatus':
        return HTTPStatus
    raise AttributeError(f"module 'dashscope' has no attribute '{name}'")