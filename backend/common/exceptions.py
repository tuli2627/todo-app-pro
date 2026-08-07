"""
Wraps DRF's default exception handler so every API error — validation errors,
404s, permission errors, etc. — comes back in the same consistent shape:

{
    "success": false,
    "error": {
        "message": "...",
        "detail": {...}
    }
}

Frontend can then always check `response.data.success` instead of guessing
the error shape per-endpoint.
"""

import logging
from rest_framework.views import exception_handler

logger = logging.getLogger('common')


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        logger.warning(f"API error: {exc} | view={context.get('view')}")

        response.data = {
            'success': False,
            'error': {
                'message': 'Request failed.',
                'detail': response.data,
            },
        }

    return response
