from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import TodoViewSet, state_wise_nursery_count 

router = DefaultRouter()
router.register(r'todos', TodoViewSet)

urlpatterns = [
    path('nursery-state-count/', state_wise_nursery_count, name='nursery_state_count'),
]

urlpatterns += router.urls