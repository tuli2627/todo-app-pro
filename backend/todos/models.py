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
class CAMPADFOUser(models.Model):
        userid = models.BigIntegerField(primary_key=True, db_column='userid')
        emailid = models.EmailField(db_column='emailid')
        Fname = models.CharField(max_length=100, db_column='Fname')
        lname = models.CharField(max_length=100, db_column='lname')
        designation = models.CharField(max_length=255, db_column='designation')
        mobilenumber = models.CharField(max_length=20, db_column='mobilenumber')

        forest_division = models.CharField(max_length=255, db_column='forest_division')
        circle = models.CharField(max_length=255, db_column='circle')
        division = models.CharField(max_length=255, db_column='division')
        district = models.CharField(max_length=255, db_column='district')
        state = models.CharField(max_length=255, db_column='state')

        password = models.CharField(max_length=500, db_column='password')

        isverified = models.BooleanField(db_column='isverified')
        status = models.CharField(max_length=100, db_column='status')

        class Meta:
            managed = False
            db_table = 'CAMPA_dfo_user'