import hashlib
import hmac
import re

from django.contrib.auth.hashers import check_password, make_password
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
class CampaDfoUserManager(BaseUserManager):
    def create_user(self, userid, password=None, **extra_fields):
        if not userid:
            raise ValueError("The User ID field must be set")
        
        user = self.model(userid=userid, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
            
        user.save(using=self._db)
        return user

    def create_superuser(self, userid, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('status', 'Active')
        extra_fields.setdefault('isverified', 1)

        return self.create_user(userid, password, **extra_fields)

class CampaDfoUser(AbstractBaseUser, PermissionsMixin):
    created_at = models.DateTimeField(auto_now_add=True)
    userid = models.CharField(max_length=100, unique=True, primary_key=True)
    emailid = models.EmailField(max_length=150, blank=True, null=True)
    fname = models.CharField(max_length=100, db_column='Fname', blank=True, null=True)
    lname = models.CharField(max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    mobilenumber = models.CharField(max_length=20, blank=True, null=True)
    forest_division = models.CharField(max_length=100, blank=True, null=True)
    circle = models.CharField(max_length=100, blank=True, null=True)
    division = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    forest_range = models.CharField(max_length=100, blank=True, null=True)
    password = models.CharField(max_length=255)
    isverified = models.IntegerField(default=0)
    tempassword = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    status_note = models.TextField(blank=True, null=True)
    current_session_id = models.CharField(max_length=255, blank=True, null=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)

    # These related_names prevent clashes if you ever add another user model back later
    groups = models.ManyToManyField('auth.Group', related_name='dfo_user_groups', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='dfo_user_permissions', blank=True)

    objects = CampaDfoUserManager()

    USERNAME_FIELD = 'userid'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'CAMPA_dfo_user'
        managed = False
# class CampaRoUserManager(BaseUserManager):
#     def create_user(self, emailid, password=None, **extra_fields):
#         if not emailid:
#             raise ValueError("Email ID must be set")

#         user = self.model(
#             emailid=emailid,
#             **extra_fields
#         )

#         if password:
#             user.set_password(password)
#         else:
#             user.set_unusable_password()

#         user.save(using=self._db)
#         return user

#     def create_superuser(self, emailid, password=None, **extra_fields):
#         extra_fields.setdefault("is_staff", True)
#         extra_fields.setdefault("is_superuser", True)
#         extra_fields.setdefault("is_active", True)

#         return self.create_user(
#             emailid,
#             password,
#             **extra_fields
#         )


# class CampaRoUser(AbstractBaseUser):
#     id = models.BigAutoField(primary_key=True)
# @property
# def login_id(self):
#     return self.emailid

#     user_level = models.CharField(

#         max_length=50,
#         blank=True,
#         null=True
#     )

#     fname = models.CharField(
#         max_length=100,
#         blank=True,
#         null=True
#     )

#     lname = models.CharField(
#         max_length=100,
#         blank=True,
#         null=True
#     )

#     emailid = models.EmailField(
#         max_length=150,
#         unique=True
#     )

#     contact_number = models.CharField(
#         max_length=20,
#         blank=True,
#         null=True
#     )

#     alternate_contact_number = models.CharField(
#         max_length=20,
#         blank=True,
#         null=True
#     )

#     designation = models.CharField(
#         max_length=150,
#         blank=True,
#         null=True
#     )

#     role = models.CharField(
#         max_length=50,
#         default="User"
#     )

#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)
#     is_superuser = models.BooleanField(default=False)

#     created_at = models.DateTimeField(auto_now_add=True)

#     objects = CampaRoUserManager()

#     USERNAME_FIELD = "emailid"
#     REQUIRED_FIELDS = []

#     class Meta:
#         db_table = "CAMPA_ro_user"
#         managed = True
class CampaRoUserManager(BaseUserManager):
    def create_user(self, emailid, password=None, **extra_fields):
        if not emailid:
            raise ValueError("Email ID must be set")

        user = self.model(
            emailid=emailid,
            **extra_fields
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, emailid, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(
            emailid,
            password,
            **extra_fields
        )
class CampaRoUser(AbstractBaseUser):
    id = models.BigAutoField(primary_key=True)

    user_level = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    fname = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    lname = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    emailid = models.EmailField(
        max_length=150,
        unique=True
    )

    contact_number = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    alternate_contact_number = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    designation = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    role = models.CharField(
        max_length=50,
        default="User"
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    objects = CampaRoUserManager()

    USERNAME_FIELD = "emailid"
    REQUIRED_FIELDS = []

    @property
    def login_id(self):
        return self.emailid

    class Meta:
        db_table = "CAMPA_ro_user"
        managed = False
class T001UserMaster(models.Model):
    id = models.BigIntegerField(primary_key=True, db_column="UM_ID")
    level_id = models.PositiveSmallIntegerField(db_column="UM_Level_ID")
    user_type = models.CharField(max_length=1, db_column="UM_Type")
    fname = models.CharField(max_length=80, db_column="UM_FName")
    lname = models.CharField(max_length=80, db_column="UM_LName")
    emailid = models.EmailField(max_length=200, db_column="UM_EmailID")
    password = models.CharField(max_length=200, db_column="UM_Password")
    designation_id = models.PositiveSmallIntegerField(
        db_column="UM_Designation_ID"
    )
    contact_number = models.CharField(
        max_length=15, blank=True, null=True, db_column="UM_MobileNo"
    )
    alternate_contact_number = models.CharField(
        max_length=15, blank=True, null=True, db_column="UM_AlternateMobileNo"
    )
    approved = models.CharField(max_length=1, db_column="UM_Approved")
    active = models.CharField(max_length=1, db_column="UM_Active")
    account_blocked = models.CharField(max_length=1, db_column="UM_AC_Blocked")
    status = models.PositiveSmallIntegerField(db_column="UM_Status")

    class Meta:
        db_table = "T001_UserMaster"
        managed = False

    @property
    def login_id(self):
        return self.emailid

    @property
    def is_active(self):
        return (
            self.active == "Y"
            and self.approved == "Y"
            and self.account_blocked != "Y"
        )

    @property
    def role(self):
        return "RO"

    @property
    def designation(self):
        return str(self.designation_id)

    def check_password(self, raw_password):
        try:
            if check_password(raw_password, self.password):
                return True
        except ValueError:
            pass

        if not isinstance(self.password, str) or not re.fullmatch(
            r"[0-9a-fA-F]{64}", self.password
        ):
            return False

        legacy_hash = hashlib.sha256(raw_password.encode("utf-8")).hexdigest()
        if not hmac.compare_digest(legacy_hash, self.password.lower()):
            return False

        self.password = make_password(raw_password)
        self.save(update_fields=["password"])
        return True

    def set_password(self, raw_password):
        self.password = make_password(raw_password)


class CampaSilviculturistUserManager(BaseUserManager):
    def create_user(self, emailid, password=None, **extra_fields):
        if not emailid:
            raise ValueError("Email ID must be set")

        user = self.model(
            emailid=emailid,
            **extra_fields
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, emailid, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(
            emailid,
            password,
            **extra_fields
        )


class CampaSilviculturistUser(AbstractBaseUser):
    id = models.BigAutoField(primary_key=True)

    user_level = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    fname = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    lname = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    emailid = models.EmailField(
        max_length=150,
        unique=True
    )

    contact_number = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    alternate_contact_number = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    designation = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    role = models.CharField(
        max_length=50,
        default="User"
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    objects = CampaSilviculturistUserManager()

    USERNAME_FIELD = "emailid"
    REQUIRED_FIELDS = []

    @property
    def login_id(self):
        return self.emailid

    class Meta:
        db_table = "CAMPA_silviculturist_user"
        managed = True