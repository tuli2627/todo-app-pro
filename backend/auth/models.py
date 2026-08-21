from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class CampaNationalUserManager(BaseUserManager):
    def create_user(self, login_id, password=None, **extra_fields):
        if not login_id:
            raise ValueError("The Login ID (Email/Username) must be set")
        
        user = self.model(login_id=login_id, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
            
        user.save(using=self._db)
        return user

    def create_superuser(self, login_id, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('status', 1)

        return self.create_user(login_id, password, **extra_fields)

class CampaNationalUser(AbstractBaseUser, PermissionsMixin):
    userid = models.BigIntegerField(blank=True, null=True)
    login_id = models.CharField(max_length=100, unique=True, primary_key=True)
    username = models.CharField(max_length=100, blank=True, null=True)
    role_name = models.CharField(max_length=100, blank=True, null=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.IntegerField(default=1)
    
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)

    objects = CampaNationalUserManager()

    USERNAME_FIELD = 'login_id'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'CAMPA_user'
        managed = False
