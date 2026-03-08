"""Show database contents"""
import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def show_database():
    print('\n📊 DATABASE OVERVIEW')
    print('=' * 70)
    print('Database: enterprise_ai_db')
    print('Location: localhost:3306')
    print('=' * 70)
    
    async with AsyncSessionLocal() as session:
        # Show tables
        print('\n📋 TABLES:')
        result = await session.execute(text('SHOW TABLES'))
        tables = result.fetchall()
        for table in tables:
            print(f'  • {table[0]}')
        
        # Show users table
        print('\n\n👥 USERS TABLE:')
        print('-' * 70)
        result = await session.execute(text('SELECT * FROM users'))
        users = result.fetchall()
        columns = result.keys()
        
        print(f'Total records: {len(users)}\n')
        for idx, user in enumerate(users, 1):
            print(f'Record {idx}:')
            for i, col in enumerate(columns):
                value = user[i]
                if value is None:
                    value = 'NULL'
                print(f'  {col:20s}: {value}')
            print()
        
        # Show predictions table
        print('\n📈 PREDICTIONS TABLE:')
        print('-' * 70)
        result = await session.execute(text('SELECT COUNT(*) FROM predictions'))
        count = result.scalar()
        print(f'Total records: {count}')
        
        if count > 0:
            result = await session.execute(text('SELECT * FROM predictions LIMIT 5'))
            predictions = result.fetchall()
            columns = result.keys()
            for idx, pred in enumerate(predictions, 1):
                print(f'\nRecord {idx}:')
                for i, col in enumerate(columns):
                    print(f'  {col:20s}: {pred[i]}')
        
        # Show decisions table
        print('\n\n📊 DECISIONS TABLE:')
        print('-' * 70)
        result = await session.execute(text('SELECT COUNT(*) FROM decisions'))
        count = result.scalar()
        print(f'Total records: {count}')
        
        if count > 0:
            result = await session.execute(text('SELECT * FROM decisions LIMIT 5'))
            decisions = result.fetchall()
            columns = result.keys()
            for idx, dec in enumerate(decisions, 1):
                print(f'\nRecord {idx}:')
                for i, col in enumerate(columns):
                    print(f'  {col:20s}: {dec[i]}')
        
        # Show table structures
        print('\n\n🔧 TABLE STRUCTURES:')
        print('=' * 70)
        
        for table in tables:
            table_name = table[0]
            print(f'\n{table_name.upper()}:')
            result = await session.execute(text(f'DESCRIBE {table_name}'))
            columns = result.fetchall()
            print(f'{"Column":<25} {"Type":<20} {"Null":<6} {"Key":<6} {"Default":<10}')
            print('-' * 70)
            for col in columns:
                null_str = 'YES' if col[2] == 'YES' else 'NO'
                key_str = col[3] if col[3] else ''
                default_str = str(col[4]) if col[4] else ''
                print(f'{col[0]:<25} {col[1]:<20} {null_str:<6} {key_str:<6} {default_str:<10}')

if __name__ == '__main__':
    asyncio.run(show_database())
