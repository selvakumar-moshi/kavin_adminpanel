import React from 'react';

export interface InfoItemProps {
    icon: string;
    label: string;
    value: React.ReactNode;
    /** Extra class for the value, e.g. `user-detail__info-item-value--keep-case` */
    valueClassName?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, valueClassName }) => (
    <div className='user-detail__info-main'>
        <img src={icon} alt='' />
        <div className='user-detail__info-item'>
            <div className='user-detail__info-item-label'>{label}</div>
            <div className={`user-detail__info-item-value${valueClassName ? ` ${valueClassName}` : ''}`}>{value}</div>
        </div>
    </div>
);

export default InfoItem;
