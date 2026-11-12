from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("backend_auth", "0012_campaworkflowoffice"),
    ]

    operations = [
        migrations.CreateModel(
            name="CampaStateWorkflowSession",
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
                ("state_id", models.BigIntegerField(unique=True)),
                ("session_id", models.UUIDField(unique=True)),
                ("workflow_role", models.CharField(max_length=30)),
                ("workflow_user_id", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "CAMPA_state_workflow_session",
            },
        ),
    ]
