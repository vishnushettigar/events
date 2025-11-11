import mysql from "mysql2/promise";
import { createClient } from "@libsql/client";


    //Tables
    const migrationData = [
        {
            mysqlTable: 'mst_temple',
            tursoTable: 'Mst_temple',
            selectQuery: 'SELECT id, code, name, address, contact_name, contact_phone, is_deleted, created_at, modified_at FROM mst_temple',
            insertQuery: 'INSERT INTO Mst_temple (id, code, name, address, contact_name, contact_phone, is_deleted, created_at, modified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        },
        {
            mysqlTable: 'mst_event_type',
            tursoTable: 'Mst_event_type',
            selectQuery: 'SELECT id, name, type, participant_count FROM mst_event_type',
            insertQuery: 'INSERT INTO Mst_event_type (id, name, type, participant_count) VALUES (?, ?, ?, ?)'
        },
        {
            mysqlTable: 'mst_age_category',
            tursoTable: 'Mst_age_category',
            selectQuery: 'SELECT id, name, from_age, to_age, is_deleted FROM mst_age_category',
            insertQuery: 'INSERT INTO Mst_age_category (id, name, from_age, to_age, is_deleted) VALUES (?, ?, ?, ?, ?)'
        },
        {
            mysqlTable: 'mst_event',
            tursoTable: 'Mst_event',
            selectQuery: 'SELECT id, event_type_id, age_category_id, gender, is_deleted, is_closed FROM mst_event',
            insertQuery: 'INSERT INTO Mst_event (id, event_type_id, age_category_id, gender, is_deleted, is_closed) VALUES (?, ?, ?, ?, ?, ?)'
        },
        {
            mysqlTable: 'mst_event_result',
            tursoTable: 'Mst_event_result',
            selectQuery: 'SELECT id, event_type_id, `rank`, points FROM mst_event_result',
            insertQuery: 'INSERT INTO Mst_event_result (id, event_type_id, rank, points) VALUES (?, ?, ?, ?)'
        }
    ];

    async function migrateData(){

        const mysqlConn = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'root',
            database: 'sports_db'
            });
        
        const turso = createClient({
            url: "libsql://events-jeevanpadmashali.aws-ap-south-1.turso.io",
            authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjE1Njc1NjMsImlkIjoiY2U5Yjk0MTEtMTA0MC00Mzk0LTlhNjQtODJiNmRiNjg4NGM2IiwicmlkIjoiZGY4NDg2ZmEtOWE5NS00NDZmLTk2ZDAtMzdkZTMyNWViMGM3In0.BhYzbs44bbzpb5doWE4GAQS7Ff2EHfJoIzf-hwZs7pS3YPo-AmrKFcPHrNgSeqQz9o9qdYVFvT_UChFn8CaKDw"
            });
            try {
                for (const table of migrationData) {
                  console.log(`\n Migrating table: ${table.mysqlTable} → ${table.tursoTable}`);
            
                  // Fetch data from MySQL
                  const [rows] = await mysqlConn.execute(table.selectQuery);
                  console.log(` Fetched ${rows.length} records from ${table.mysqlTable}`);
            
                  //Insert into Turso
                  for (const row of rows) {
                    const values = Object.values(row);
                    await turso.execute({
                      sql: table.insertQuery,
                      args: values,
                    });
                  }
            
                  console.log(`Successfully inserted ${rows.length} records into ${table.tursoTable}`);
                }
            
                console.log(" Migration completed for all tables!");
              }catch (err) {
                console.error("Error during migration:", err);
              } finally {
                //Close connections
                await mysqlConn.end();
                turso.close();
                console.log("Connections closed.");
              }
    }

migrateData();