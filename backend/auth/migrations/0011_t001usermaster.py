from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend_auth', '0010_campasilviculturistuser'),
    ]

    operations = [
        migrations.CreateModel(
            name='T001UserMaster',
            fields=[
                ('id', models.BigIntegerField(db_column='UM_ID', primary_key=True, serialize=False)),
                ('level_id', models.PositiveSmallIntegerField(db_column='UM_Level_ID')),
                ('user_type', models.CharField(db_column='UM_Type', max_length=1)),
                ('fname', models.CharField(db_column='UM_FName', max_length=80)),
                ('lname', models.CharField(db_column='UM_LName', max_length=80)),
                ('emailid', models.EmailField(db_column='UM_EmailID', max_length=200)),
                ('password', models.CharField(db_column='UM_Password', max_length=200)),
                ('designation_id', models.PositiveSmallIntegerField(db_column='UM_Designation_ID')),
                ('contact_number', models.CharField(blank=True, db_column='UM_MobileNo', max_length=15, null=True)),
                ('alternate_contact_number', models.CharField(blank=True, db_column='UM_AlternateMobileNo', max_length=15, null=True)),
                ('approved', models.CharField(db_column='UM_Approved', max_length=1)),
                ('active', models.CharField(db_column='UM_Active', max_length=1)),
                ('account_blocked', models.CharField(db_column='UM_AC_Blocked', max_length=1)),
                ('status', models.PositiveSmallIntegerField(db_column='UM_Status')),
            ],
            options={
                'db_table': 'T001_UserMaster',
                'managed': False,
            },
        ),
    ]
