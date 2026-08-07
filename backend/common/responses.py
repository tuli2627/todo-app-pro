"""
Small helper so views that don't go through the standard pagination path
(e.g. a single-object create/update) can still return the same
{ success, data } envelope as everything else.
"""

from rest_framework.response import Response


def success_response(data=None, message="OK", status_code=200):
    return Response(
        {
            'success': True,
            'message': message,
            'data': data,
        },
        status=status_code,
    )
