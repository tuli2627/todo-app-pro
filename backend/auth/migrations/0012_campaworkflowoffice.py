from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("backend_auth", "0011_t001usermaster"),
    ]

    operations = [
        migrations.CreateModel(
            name="CampaWorkflowOffice",
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
                ("office_id", models.CharField(max_length=100)),
                ("role", models.CharField(max_length=20)),
                ("state_id", models.BigIntegerField()),
                ("circle_id", models.BigIntegerField(blank=True, null=True)),
                ("division_id", models.BigIntegerField(blank=True, null=True)),
                ("office_name", models.CharField(blank=True, max_length=200)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "CAMPA_workflow_office",
                "constraints": [
                    models.UniqueConstraint(
                        fields=("office_id", "role"),
                        name="campa_wf_office_role_uniq",
                    ),
                ],
            },
        ),
    ]
