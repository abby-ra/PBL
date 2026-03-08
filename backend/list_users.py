"""Quick check of registered users"""
import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def list_users():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text('SELECT id, email, full_name, role, is_active FROM users ORDER BY id')
        )
        users = result.fetchall()
        
        print('\n' + '=' * 70)
        print('👥 REGISTERED USERS')
        print('=' * 70)
        
        for user in users:
            user_id, email, full_name, role, is_active = user
            status = '✓ Active' if is_active else '✗ Inactive'
            print(f'\n{user_id}. {email}')
            print(f'   Name: {full_name}')
            print(f'   Role: {role}')
            print(f'   Status: {status}')
        
        print('\n' + '=' * 70)
        print(f'Total Users: {len(users)}')
        print('=' * 70 + '\n')

if __name__ == '__main__':
    asyncio.run(list_users())
