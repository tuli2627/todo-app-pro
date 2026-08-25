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
# 
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


# ==========================================
# M001 State Model
# ==========================================
class M001State(models.Model):
    state_id = models.IntegerField(primary_key=True, db_column='State_ID')
    state_category = models.CharField(max_length=50, db_column='State_Category', null=True, blank=True)
    state_name = models.CharField(max_length=150, db_column='State_Name')
    state_active = models.CharField(max_length=1, db_column='State_Active', default='Y')
    state_entryby = models.IntegerField(db_column='State_Entryby', null=True, blank=True)
    state_entryon = models.DateTimeField(db_column='State_Entryon', null=True, blank=True)
    state_code = models.CharField(max_length=10, db_column='State_Code')
    state_apo_id = models.IntegerField(db_column='State_APO_ID', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'M001_State'

    def __str__(self):
        return self.state_name


# ==========================================
# M002 District & Circle Models
# ==========================================
class M002District(models.Model):
    district_id = models.AutoField(primary_key=True, db_column='District_ID')
    district_state_id = models.IntegerField(db_column='District_State_ID')
    district_name = models.CharField(max_length=255, db_column='District_Name')
    district_active = models.CharField(max_length=1, db_column='District_Active', null=True, blank=True)
    district_entryby = models.IntegerField(db_column='District_Entryby', null=True, blank=True)
    district_entryon = models.DateTimeField(db_column='District_Entryon', null=True, blank=True)

    class Meta:
        managed = False
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
# M003 Division Model
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


# ==========================================
# T007 Nursery Model
# ==========================================
class T007Nursery(models.Model):
    nursery_id = models.BigAutoField(primary_key=True, db_column='Nursery_ID')
    nursery_uniquecode = models.CharField(max_length=50, db_column='Nursery_UniqueCode', null=True, blank=True)
    
    nursery_state = models.ForeignKey(
        M001State,
        on_delete=models.DO_NOTHING,
        db_column='Nursery_State_ID'
    )

    nursery_district_id = models.BigIntegerField(db_column='Nursery_District_ID', null=True, blank=True)
    nursery_division_id = models.BigIntegerField(db_column='Nursery_Division_ID', null=True, blank=True)
    nursery_range_id = models.BigIntegerField(db_column='Nursery_Range_ID', null=True, blank=True)
    nursery_propagation_type = models.CharField(max_length=50, db_column='Nursery_Propagation_Type', null=True, blank=True)
    nursery_name = models.CharField(max_length=250, db_column='Nursery_Name')
    nursery_maintainby = models.CharField(max_length=50, db_column='Nursery_MaintainBy', null=True, blank=True)
    nursery_year_id = models.IntegerField(db_column='Nursery_Year_ID', null=True, blank=True)
    nursery_location = models.CharField(max_length=250, db_column='Nursery_Location', null=True, blank=True)
    nursery_distance = models.DecimalField(max_digits=10, decimal_places=2, db_column='Nursery_Distance', null=True, blank=True)
    nursery_photo = models.CharField(max_length=500, db_column='Nursery_PHOTO', null=True, blank=True)
    nursery_latitude = models.CharField(max_length=50, db_column='Nursery_Latitude', null=True, blank=True)
    nursery_longitude = models.CharField(max_length=50, db_column='Nursery_Longitude', null=True, blank=True)
    nursery_active = models.CharField(max_length=1, db_column='Nursery_Active', default='Y')
    nursery_entryby = models.BigIntegerField(db_column='Nursery_EntryBy', null=True, blank=True)
    nursery_entryon = models.DateTimeField(db_column='Nursery_EntryOn', null=True, blank=True)
    nursery_updatedby = models.BigIntegerField(db_column='Nursery_UpdatedBy', null=True, blank=True)
    nursery_updatedon = models.DateTimeField(db_column='Nursery_UpdatedOn', null=True, blank=True)
    nursery_status = models.CharField(max_length=1, db_column='Nursery_Status', null=True, blank=True)
    nursery_approvedby = models.BigIntegerField(db_column='Nursery_ApprovedBy', null=True, blank=True)
    nursery_approvedon = models.DateTimeField(db_column='Nursery_ApprovedOn', null=True, blank=True)
    nursery_kmlurl = models.CharField(max_length=500, db_column='Nursery_KMLURL', null=True, blank=True)
    nursery_subdistrict_id = models.BigIntegerField(db_column='Nursery_SubDistrict_ID', null=True, blank=True)
    nursery_block_id = models.BigIntegerField(db_column='Nursery_Block_ID', null=True, blank=True)
    nursery_contact_person_name = models.CharField(max_length=150, db_column='Nursery_Contact_Person_Name', null=True, blank=True)
    nursery_contact_person_designation = models.CharField(max_length=150, db_column='Nursery_Contact_Person_Designation', null=True, blank=True)
    nursery_contact_person_phone = models.CharField(max_length=50, db_column='Nursery_Contact_Person_Phone', null=True, blank=True)
    nursery_address = models.CharField(max_length=500, db_column='Nursery_Address', null=True, blank=True)
    nursery_website = models.CharField(max_length=250, db_column='Nursery_Website', null=True, blank=True)
    nursery_circle_id = models.BigIntegerField(db_column='Nursery_Circle_ID', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'T007_Nursery'

    def __str__(self):
        return self.nursery_name


# ==========================================
# T030 Advance Booking Model
# ==========================================
class T030AdvanceBooking(models.Model):
    ab_id = models.BigAutoField(primary_key=True, db_column='AB_ID')
    ab_uniquecode = models.CharField(max_length=50, db_column='AB_UniqueCode')

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

    ab_nursery = models.ForeignKey(
        T007Nursery,
        on_delete=models.DO_NOTHING,
        db_column='AB_Nursery_ID'
    )

    ab_species_id = models.BigIntegerField(db_column='AB_Species_ID')
    ab_plant_no = models.BigIntegerField(db_column='AB_Plant_No')
    ab_date_avaiable = models.DateField(db_column='AB_Date_Avaiable')
    ab_amount = models.DecimalField(max_digits=18, decimal_places=2, db_column='AB_Amount')
    ab_photo = models.CharField(max_length=50, db_column='AB_PHOTO')
    ab_active = models.CharField(max_length=1, db_column='AB_Active')
    ab_entryby = models.BigIntegerField(db_column='AB_EntryBy')
    ab_entryon = models.DateTimeField(db_column='AB_EntryOn')

    ab_updatedby = models.BigIntegerField(db_column='AB_UpdatedBy', null=True, blank=True)
    ab_updatedon = models.DateTimeField(db_column='AB_UpdatedOn', null=True, blank=True)
    ab_status = models.CharField(max_length=1, db_column='AB_Status', null=True, blank=True)
    ab_approvedby = models.BigIntegerField(db_column='AB_ApprovedBy', null=True, blank=True)
    ab_approvedon = models.DateTimeField(db_column='AB_ApprovedOn', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'T030_AdvanceBooking'