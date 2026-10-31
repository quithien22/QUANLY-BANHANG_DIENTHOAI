"""Kết nối SQL Server."""
import urllib.parse

from sqlalchemy import create_engine

import config


def get_engine():
    odbc = (
        f"DRIVER={{{config.DB_DRIVER}}};"
        f"SERVER={config.DB_SERVER};"
        f"DATABASE={config.DB_NAME};"
        f"UID={config.DB_USER};PWD={config.DB_PASSWORD};"
        "TrustServerCertificate=yes;Encrypt=no"
    )
    return create_engine("mssql+pyodbc:///?odbc_connect=" + urllib.parse.quote_plus(odbc))
