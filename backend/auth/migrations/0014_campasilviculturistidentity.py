from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("backend_auth", "0013_campastateworkflowsession"),
    ]

    operations = [
        migrations.CreateModel(
            name="CampaSilviculturistIdentity",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("user_id", models.BigIntegerField(unique=True)),
                ("aadhaar_last4", models.CharField(max_length=4)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "CAMPA_silviculturist_identity",
            },
        ),
    ]
