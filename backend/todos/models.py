# from django.db import models
# class Todo(models.Model):
#     title = models.CharField(max_length=200)
#     completed = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         ordering = ['-created_at']

#     def __str__(self):
#         return self.title
# class M001State(models.Model):
   
#     state_id = models.IntegerField(primary_key=True, db_column='State_ID') 
#     state_name = models.CharField(max_length=100, db_column='State_Name')
#     state_code = models.CharField(max_length=10, db_column='State_Category')

#     class Meta:
#         managed = False
#         db_table = 'M001_State' 

# class T007Nursery(models.Model):
#     nursery_id = models.BigAutoField(primary_key=True, db_column='Nursery_ID')

#     nursery_state = models.ForeignKey(
#         M001State, 
#         on_delete=models.DO_NOTHING, 
#         db_column='Nursery_State_ID' 
#     )
    
#     nursery_name = models.CharField(max_length=50, db_column='Nursery_Name')

#     class Meta:
#         managed = False
#         db_table = 'T007_Nursery'
# class CAMPADFOUser(models.Model):
#         userid = models.BigIntegerField(primary_key=True, db_column='userid')
#         emailid = models.EmailField(db_column='emailid')
#         Fname = models.CharField(max_length=100, db_column='Fname')
#         lname = models.CharField(max_length=100, db_column='lname')
#         designation = models.CharField(max_length=255, db_column='designation')
#         mobilenumber = models.CharField(max_length=20, db_column='mobilenumber')

#         forest_division = models.CharField(max_length=255, db_column='forest_division')
#         circle = models.CharField(max_length=255, db_column='circle')
#         division = models.CharField(max_length=255, db_column='division')
#         district = models.CharField(max_length=255, db_column='district')
#         state = models.CharField(max_length=255, db_column='state')

#         password = models.CharField(max_length=500, db_column='password')

#         isverified = models.BooleanField(db_column='isverified')
#         status = models.CharField(max_length=100, db_column='status')

#         class Meta:
#             managed = False
#             db_table = 'CAMPA_dfo_user'
from django.db import models

class Todo(models.Model):
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class M001State(models.Model):
    state_id = models.IntegerField(primary_key=True, db_column='State_ID') 
    state_name = models.CharField(max_length=100, db_column='State_Name')
    state_code = models.CharField(max_length=10, db_column='State_Category')

    class Meta:
        managed = False
        db_table = 'M001_State' 

# ==========================================
# ADDED: M002 District Model
# ==========================================
class M002District(models.Model):
    district_id = models.AutoField(primary_key=True, db_column='District_ID')
    district_state_id = models.IntegerField(db_column='District_State_ID')
    district_name = models.CharField(max_length=255, db_column='District_Name')
    district_active = models.CharField(max_length=1, db_column='District_Active', null=True, blank=True)
    district_entryby = models.IntegerField(db_column='District_Entryby', null=True, blank=True)
    district_entryon = models.DateTimeField(db_column='District_Entryon', null=True, blank=True)

    class Meta:
        managed = False  # Django won't try to alter your existing SQL table
        db_table = 'M002_District'

    def __str__(self):
        return self.district_name
class M002Circle(models.Model):
    circle_id = models.AutoField(primary_key=True, db_column='Circle_ID')
    circle_state_id = models.IntegerField(db_column='Circle_State_ID')
    circle_name = models.CharField(max_length=255, db_column='Circle_Name')
    circle_active = models.CharField(max_length=1, db_column='Circle_Active', null=True, blank=True)
    circle_entryby = models.IntegerField(db_column='Circle_Entryby', null=True, blank=True)
    circle_entryon = models.DateTimeField(db_column='Circle_Entryon', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'M002_Circle'

    def __str__(self):
        return self.circle_name
# ==========================================
# ADDED: M003 Division Model
# ==========================================
class M003Division(models.Model):
    division_id = models.AutoField(primary_key=True, db_column='Division_ID')
    division_circle_id = models.IntegerField(db_column='Division_Circle_ID')
    division_name = models.CharField(max_length=255, db_column='Division_Name')
    division_active = models.CharField(max_length=1, db_column='Division_Active', null=True, blank=True)
    division_entryby = models.IntegerField(db_column='Division_EntryBy', null=True, blank=True)
    division_entryon = models.DateTimeField(db_column='Division_EntryOn', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'M003_Division'

    def __str__(self):
        return self.division_name

class T007Nursery(models.Model):
    nursery_id = models.BigAutoField(primary_key=True, db_column='Nursery_ID')

    nursery_state = models.ForeignKey(
        M001State, 
        on_delete=models.DO_NOTHING, 
        db_column='Nursery_State_ID' 
    )
    
    nursery_name = models.CharField(max_length=50, db_column='Nursery_Name')

    class Meta:
        managed = False
        db_table = 'T007_Nursery'

class T030AdvanceBooking(models.Model):
    ab_id = models.BigAutoField(primary_key=True, db_column='AB_ID')
    ab_uniquecode = models.CharField(max_length=50, db_column='AB_UniqueCode')
    
    # Linked to your M001State model
    ab_state = models.ForeignKey(
        M001State, 
        on_delete=models.DO_NOTHING, 
        db_column='AB_State_ID'
    )
    
    ab_district_id = models.BigIntegerField(db_column='AB_District_ID')
    ab_division_id = models.BigIntegerField(db_column='AB_Division_ID')
    ab_soldto = models.CharField(max_length=2, db_column='AB_SoldTo')
    ab_govttype = models.CharField(max_length=2, db_column='AB_GovtType', null=True, blank=True)
    ab_name = models.CharField(max_length=100, db_column='AB_Name')
    ab_staff_name = models.CharField(max_length=100, db_column='AB_Staff_Name')
    ab_staff_contact = models.CharField(max_length=10, db_column='AB_Staff_Contact')
    
    # Linked to your T007Nursery model
    ab_nursery = models.ForeignKey(
        T007Nursery, 
        on_delete=models.DO_NOTHING, 
        db_column='AB_Nursery_ID'
    )
    
    ab_species_id = models.BigIntegerField(db_column='AB_Species_ID')
    ab_plant_no = models.BigIntegerField(db_column='AB_Plant_No')
    ab_date_avaiable = models.DateField(db_column='AB_Date_Avaiable') # Matched DB spelling
    ab_amount = models.DecimalField(max_digits=18, decimal_places=2, db_column='AB_Amount')
    ab_photo = models.CharField(max_length=50, db_column='AB_PHOTO')
    ab_active = models.CharField(max_length=1, db_column='AB_Active')
    ab_entryby = models.BigIntegerField(db_column='AB_EntryBy')
    ab_entryon = models.DateTimeField(db_column='AB_EntryOn')
    
    # Nullable audit fields
    ab_updatedby = models.BigIntegerField(db_column='AB_UpdatedBy', null=True, blank=True)
    ab_updatedon = models.DateTimeField(db_column='AB_UpdatedOn', null=True, blank=True)
    ab_status = models.CharField(max_length=1, db_column='AB_Status', null=True, blank=True)
    ab_approvedby = models.BigIntegerField(db_column='AB_ApprovedBy', null=True, blank=True)
    ab_approvedon = models.DateTimeField(db_column='AB_ApprovedOn', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'T030_AdvanceBooking'