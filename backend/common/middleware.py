"""
Custom project-wide middleware.

RequestLoggingMiddleware  — logs method, path, status code and duration of every request.
ExceptionLoggingMiddleware — catches unhandled exceptions, logs them, and returns
                              a clean JSON error instead of Django's HTML debug page
                              leaking to API consumers.
"""

import logging
import time
import json

from django.http import JsonResponse

logger = logging.getLogger('common')


class RequestLoggingMiddleware:
    """Logs every incoming request with timing info. Good for spotting slow endpoints."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        duration_ms = (time.time() - start_time) * 1000
        logger.info(
            f"{request.method} {request.path} -> {response.status_code} "
            f"({duration_ms:.1f}ms)"
        )
        return response


class ExceptionLoggingMiddleware:
    """
    Catches any exception that bubbles up outside DRF views (e.g. from plain
    Django views or middleware itself) and returns a consistent JSON shape
    instead of an HTML traceback, so the frontend always gets parseable JSON.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        logger.error(f"Unhandled exception on {request.path}: {exception}", exc_info=True)

        return JsonResponse(
            {
                'success': False,
                'error': {
                    'message': 'Something went wrong on the server.',
                    'detail': str(exception),
                },
            },
            status=500,
        )
