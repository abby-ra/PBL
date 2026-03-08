"""Create additional test users in database"""
import asyncio
from app.db.session import AsyncSessionLocal
from app.models import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def create_test_users():
    print('\n📝 Creating test users...')
    print('=' * 60)
    
    test_users = [
        {
            "email": "admin@test.com",
            "password": "admin123",
            "full_name": "Admin User",
            "role": "ADMIN"
        },
        {
            "email": "user@test.com", 
            "password": "user123",
            "full_name": "Test User",
            "role": "VIEWER"
        }
    ]
    
    async with AsyncSessionLocal() as session:
        for user_data in test_users:
            # Check if user already exists
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f'✓ User already exists: {user_data["email"]}')
            else:
                # Create new user
                new_user = User(
                    email=user_data["email"],
                    hashed_password=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    is_active=True,
                    is_superuser=user_data["role"] == "ADMIN"
                )
                session.add(new_user)
                await session.commit()
                print(f'✓ Created new user: {user_data["email"]}')
                print(f'  Password: {user_data["password"]}')
                print(f'  Role: {user_data["role"]}')
    
    print('\n' + '=' * 60)
    print('✅ Test users setup complete!\n')
    print('Available login credentials:')
    print('  1. admin@test.com / admin123 (Admin)')
    print('  2. user@test.com / user123 (Viewer)')
    print('=' * 60)

if __name__ == '__main__':
    asyncio.run(create_test_users())
