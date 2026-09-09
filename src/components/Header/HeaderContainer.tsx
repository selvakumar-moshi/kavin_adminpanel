import { Menu,Dropdown,} from 'antd';
import User_Icon from "../../assets/User_Icon.svg";
import Logout_Icon from "../../assets/Logout_Icon.svg";
import coachingLogo from "../../assets/coaching.png";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../services/CSuperSales';
import type { RootState } from '../../services/Store';

const HeaderContainer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { SSLoginData } = useSelector((state: RootState) => state.superSales);
  const loggedInUser = SSLoginData?.user;

  const handleLogout = () =>{
    dispatch(logout());
    navigate('/login');
  }
  return (
     <div className='header'>
        {/* Left Section - Logo and App Name */}
        <div className="header__left">
          <div className="header__logo">
            <img src={coachingLogo} alt='ssil-logo' />
          </div>
          <div className="header__app-name">
            Admin Panel
          </div>
        </div>

        {/* Right Section - User Info and Actions */}
        <div className="header__right">
          {/* User Greeting */}
          <div className="header__greeting">
            <span className="header__greeting-text">
              Hello <span className="header__user-name">{loggedInUser?.firstName}!</span>
            </span>
          </div>
          
          {/* User Role with Dropdown */}
          <Dropdown
            popupRender={() => (
              <Menu className="header__profile-menu">
                <div className="header__profile-content">
                  <div className="header__profile-header">
                      <span className="header__profile-title">Profile</span>
                  </div>
                    
                  <div className="header__profile-info">
                      <div className="header__profile-row">
                        <span className="header__profile-label">First Name</span>
                        <span className="header__profile-value">{loggedInUser?.firstName || '-'}</span>
                        <div className="header__border-line"></div>
                      </div>
                      <div className="header__profile-row">
                        <span className="header__profile-label">Last Name</span>
                        <span className="header__profile-value">{loggedInUser?.lastName || '-'}</span>
                        <div className="header__border-line"></div>
                      </div>
                      <div className="header__profile-row">
                        <span className="header__profile-label">Role</span>
                        <span className="header__profile-value">{loggedInUser?.role || '-'}</span>
                        <div className="header__border-line"></div>
                      </div>
                      <div className="header__profile-row">
                        <span className="header__profile-label">Email Address</span>
                        <span className="header__profile-value">{loggedInUser?.email || '-'}</span>
                        <div className="header__border-line"></div>
                      </div>
                  </div>
                </div>
              </Menu>
            )}
            trigger={['hover']}
            placement="bottomRight"
            classNames={{ root: 'header__profile-dropdown' }}
            // open={isDropdownOpen}
            // onOpenChange={onDropdownVisibleChange}
            getPopupContainer={() => document.body}
          >
            <div className="header__role">
              <img src={User_Icon} alt='user-icon' />
              <div className="header__role-text">Profile</div>
            </div>
          </Dropdown>

          {/* Logout */}
          <div className="header__logout" onClick={handleLogout}>
            <img src={Logout_Icon} alt='user-icon' />
            <span className="header__logout-text">Logout</span>
          </div>
        </div>
      </div>
  );
};

export default HeaderContainer;